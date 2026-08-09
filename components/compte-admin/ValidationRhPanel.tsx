"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface PendingAttempt {
  id: string;
  status: string;
  candidat: { firstName: string; lastName: string; email: string };
  tier: string | null;
  totalScore: number | null;
  gradedAt: string | null;
  contractDuree: string | null;
  contractFrais: string | null;
  contractConditions: string | null;
}

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

  function refresh() {
    setAttempts("loading");
    apiGet<PendingAttempt[]>("/evaluation/pending-validation", adminHeaders())
      .then(setAttempts)
      .catch(() => setAttempts("erreur"));
  }

  useEffect(refresh, []);

  function openAttempt(a: PendingAttempt) {
    setOpenId(a.id);
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
      setOpenId(null);
      setStatus("idle");
      refresh();
      onChange?.();
    } catch {
      setStatus("error");
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
    } catch {
      setStatus("error");
    }
  }

  async function sendNow(id: string) {
    setStatus("saving");
    try {
      await apiPostAuthed(`/evaluation/attempts/${id}/send-now`, {}, adminHeaders());
      setOpenId(null);
      setStatus("idle");
      refresh();
      onChange?.();
    } catch {
      setStatus("error");
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
                      <div className="grid gap-3 sm:grid-cols-2">
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
                          <Button variant="ghostDark" onClick={() => sendNow(a.id)} disabled={status === "saving"}>
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
                        <p className="mt-2 font-mono text-xs text-accent">Erreur — réessayer.</p>
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
