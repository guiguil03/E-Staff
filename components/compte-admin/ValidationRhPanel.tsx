"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { ApiError, apiGet, apiPostAuthed, apiUpload } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface PendingAttempt {
  id: string;
  status: string;
  candidat: { id: string; firstName: string; lastName: string; email: string; cvKey: string | null };
  tier: string | null;
  totalScore: number | null;
  lexiqueScore: number | null;
  oralScore: number | null;
  situationsScore: number | null;
  videoScore: number | null;
  essayScore: number | null;
  gradedAt: string | null;
  contractDuree: string | null;
  contractFrais: string | null;
  contractConditions: string | null;
}

const BLOC_LABELS: { key: keyof PendingAttempt; label: string }[] = [
  { key: "lexiqueScore", label: "Bloc 1 — Lexique & questions ouvertes" },
  { key: "essayScore", label: "Bloc 2 — Commentaire argumentatif" },
  { key: "situationsScore", label: "Bloc 3 — Mises en situation" },
  { key: "oralScore", label: "Bloc 4 — Compréhension orale" },
  { key: "videoScore", label: "Bloc 5 — Production vidéo" },
];

function adminHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-admin-matricule": matricule } : {};
}

const emptyForm = { duree: "", frais: "", conditions: "" };

interface ValidationRhPanelProps {
  /** Prévient le parent qu'un statut a changé, pour rafraîchir la Vue
   * d'ensemble (autrement en cache jusqu'au prochain rechargement complet). */
  onChange?: () => void;
}

// Écran RH — liste des évaluations corrigées ("corrige") et des contrats
// déjà préparés/envoyés mais pas encore payés ("valide_pret_envoi" /
// "contrat_envoye" — modifiables tant que le paiement n'est pas confirmé,
// voir EvaluationService.validateContract). Valider/Modifier saisit les
// termes du contrat (variables selon le candidat/niveau, pas de modèle
// figé — voir brainstorm 2026-08-09), génère le PDF côté serveur et passe
// (ou repasse) la tentative en "valide_pret_envoi" : le cron de 20h se
// charge de l'envoi groupé, ou "Envoyer maintenant" pour bypasser l'attente.
export default function ValidationRhPanel({ onChange }: ValidationRhPanelProps) {
  const [attempts, setAttempts] = useState<PendingAttempt[] | "loading" | "erreur">("loading");
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  // Message renvoyé par le serveur (ex. « le CV du candidat n'a pas été
  // déposé ») : sans lui, toute erreur se réduisait à « Erreur — réessayer ».
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Confirmation après une action réussie : sans elle, la ligne reste dans la
  // liste (« en attente d'envoi ») et on croit que rien ne s'est passé.
  const [notice, setNotice] = useState<string | null>(null);

  function echec(err: unknown, parDefaut: string) {
    setErrorMessage(err instanceof ApiError ? err.message : parDefaut);
    setStatus("error");
  }

  async function deposerCv(candidatId: string, file: File) {
    setStatus("saving");
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("cv", file, file.name);
      await apiUpload(`/evaluation/candidats/${candidatId}/cv`, formData, adminHeaders());
      setStatus("idle");
      refresh();
    } catch (err) {
      echec(err, "Échec du dépôt du CV (PDF, 10 Mo max).");
    }
  }

  function refresh() {
    setAttempts("loading");
    apiGet<PendingAttempt[]>("/evaluation/pending-validation", adminHeaders())
      .then(setAttempts)
      .catch(() => setAttempts("erreur"));
  }

  useEffect(refresh, []);

  function openAttempt(a: PendingAttempt) {
    setOpenId(a.id);
    setNotice(null);
    setErrorMessage(null);
    setForm({
      duree: a.contractDuree ?? "",
      frais: a.contractFrais ?? "",
      conditions: a.contractConditions ?? "",
    });
    setStatus("idle");
  }

  async function validate() {
    if (!openId || !form.duree.trim() || !form.frais.trim() || !form.conditions.trim()) return;
    setStatus("saving");
    try {
      await apiPostAuthed(`/evaluation/attempts/${openId}/validate-contract`, form, adminHeaders());
      setNotice(
        "Contrat généré. Il sera envoyé au candidat à 20h (heure de Madagascar) — ou cliquez sur « Envoyer maintenant » dans sa ligne. Le candidat apparaîtra dans « Paiements en attente » une fois sa référence de paiement transmise."
      );
      setOpenId(null);
      setStatus("idle");
      refresh();
      onChange?.();
    } catch (err) {
      echec(err, "Échec de la validation du contrat.");
    }
  }

  async function reject() {
    if (!openId) return;
    if (!window.confirm("Marquer ce candidat comme non retenu ? Un e-mail lui sera envoyé.")) return;
    setStatus("saving");
    try {
      await apiPostAuthed(`/evaluation/attempts/${openId}/reject`, {}, adminHeaders());
      setOpenId(null);
      setStatus("idle");
      refresh();
      onChange?.();
    } catch (err) {
      echec(err, "Échec de l'enregistrement du refus.");
    }
  }

  async function sendNow(id: string, nom: string) {
    if (!window.confirm(`Envoyer le contrat à ${nom} maintenant, sans attendre l'envoi groupé de 20h ?`)) return;
    setStatus("saving");
    try {
      await apiPostAuthed(`/evaluation/attempts/${id}/send-now`, {}, adminHeaders());
      setNotice(
        `Contrat envoyé à ${nom}. Il apparaîtra dans « Paiements en attente » dès qu'il aura transmis sa référence de paiement.`
      );
      setOpenId(null);
      setStatus("idle");
      refresh();
      onChange?.();
    } catch (err) {
      echec(err, "Échec de l'envoi du contrat.");
    }
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">
          Validation RH — contrats
        </h3>
        <p className="mt-1 font-sans text-xs text-white/50">
          Évaluations corrigées à valider, et contrats déjà préparés (modifiables jusqu&apos;au
          paiement).
        </p>

        {notice && (
          <p className="mt-3 rounded border border-success/40 px-3 py-2 font-sans text-xs text-success">
            {notice}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {attempts === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
          {attempts === "erreur" && (
            <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>
          )}
          {Array.isArray(attempts) && attempts.length === 0 && (
            <p className="font-sans text-sm text-white/50">Rien à traiter pour le moment.</p>
          )}
          {Array.isArray(attempts) &&
            attempts.map((a) => {
              const isNew = a.status === "corrige";
              return (
                <div key={a.id}>
                  <button
                    onClick={() => openAttempt(a)}
                    className={`flex w-full items-center justify-between rounded border px-4 py-3 text-left transition-colors ${
                      openId === a.id
                        ? "border-accent bg-obsidian"
                        : "border-white/10 bg-obsidian hover:border-accent/50"
                    }`}
                  >
                    <span>
                      <span className="block font-sans text-sm text-white">
                        {a.candidat.firstName} {a.candidat.lastName}
                      </span>
                      <span
                        className={`block font-mono text-[11px] ${
                          a.tier === "refuse" ? "text-accent" : "text-white/40"
                        }`}
                      >
                        {a.tier === "refuse" ? "Non retenu (suggéré)" : (a.tier ?? "—")} ·{" "}
                        {a.totalScore ?? "—"}/100
                        {!isNew &&
                          ` · ${a.status === "contrat_envoye" ? "contrat envoyé" : "en attente d'envoi"}`}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-accent">
                      {openId === a.id ? "Ouvert" : isNew ? "Valider" : "Modifier"}
                    </span>
                  </button>

                  {openId === a.id && (
                    <div className="mt-2 rounded border border-accent/30 bg-obsidian p-4">
                      <p className="font-mono text-xs uppercase tracking-widest text-white/50">
                        Résultat du test (corrigé par le formateur)
                      </p>
                      <div className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                        {BLOC_LABELS.map(({ key, label }) => {
                          const score = a[key] as number | null;
                          return (
                            <div key={key} className="flex items-center justify-between gap-2">
                              <span className="font-sans text-xs text-white/60">{label}</span>
                              <span className="shrink-0 font-mono text-xs text-white/80">
                                {score ?? "—"}/20
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-2 font-mono text-xs text-accent">
                        Total : {a.totalScore ?? "—"}/100 —{" "}
                        {a.tier === "refuse" ? "Non retenu (suggéré)" : (a.tier ?? "—")}
                      </p>

                      {!a.candidat.cvKey && (
                        <div className="mt-4 rounded border border-accent/40 p-3">
                          <p className="font-sans text-xs text-accent">
                            Le candidat n&apos;a pas déposé son CV : la validation du contrat est
                            impossible tant qu&apos;il manque. Déposez-le ici (PDF, 10 Mo max).
                          </p>
                          <input
                            type="file"
                            accept="application/pdf"
                            disabled={status === "saving"}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void deposerCv(a.candidat.id, file);
                              e.target.value = "";
                            }}
                            className="mt-2 block w-full font-sans text-xs text-white/70 file:mr-3 file:rounded file:border file:border-white/20 file:bg-obsidianCard file:px-3 file:py-1 file:text-white"
                          />
                        </div>
                      )}

                      <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
                        <div>
                          <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                            Durée
                          </label>
                          <input
                            value={form.duree}
                            onChange={(e) => setForm((f) => ({ ...f, duree: e.target.value }))}
                            placeholder="Ex. 6 mois"
                            className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                            Frais
                          </label>
                          <input
                            value={form.frais}
                            onChange={(e) => setForm((f) => ({ ...f, frais: e.target.value }))}
                            placeholder="Ex. 250 000 Ar"
                            className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                      <label className="mt-3 block font-mono text-xs uppercase tracking-widest text-white/50">
                        Conditions
                      </label>
                      <textarea
                        rows={3}
                        value={form.conditions}
                        onChange={(e) => setForm((f) => ({ ...f, conditions: e.target.value }))}
                        className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                      />
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Button
                          variant="dark"
                          onClick={validate}
                          disabled={
                            status === "saving" ||
                            !form.duree.trim() ||
                            !form.frais.trim() ||
                            !form.conditions.trim()
                          }
                        >
                          {status === "saving"
                            ? "Génération..."
                            : isNew
                              ? "Valider et générer le PDF"
                              : "Enregistrer les modifications"}
                        </Button>
                        {a.status === "valide_pret_envoi" && (
                          <Button variant="ghostDark" onClick={() => sendNow(a.id, `${a.candidat.firstName} ${a.candidat.lastName}`)} disabled={status === "saving"}>
                            Envoyer maintenant
                          </Button>
                        )}
                        <Button variant="ghostDark" onClick={() => setOpenId(null)}>
                          Annuler
                        </Button>
                        {isNew && (
                          <button
                            onClick={reject}
                            disabled={status === "saving"}
                            className="ml-auto font-mono text-xs uppercase tracking-widest text-white/40 hover:text-accent disabled:opacity-50"
                          >
                            Marquer non retenu
                          </button>
                        )}
                      </div>
                      {status === "error" && (
                        <p className="mt-2 font-mono text-xs text-accent">
                          {errorMessage ?? "Erreur — réessayer."}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </Reveal>
  );
}
