"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface PendingAttempt {
  id: string;
  candidat: { firstName: string; lastName: string; email: string };
  tier: string | null;
  totalScore: number | null;
  gradedAt: string | null;
}

function adminHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-admin-matricule": matricule } : {};
}

const emptyForm = { duree: "", frais: "", conditions: "" };

// Écran RH — liste des évaluations corrigées en attente de validation
// (statut "corrige"). Valider saisit les termes du contrat (variables selon
// le candidat/niveau, pas de modèle figé — voir brainstorm 2026-08-09),
// génère le PDF côté serveur et passe la tentative en
// "valide_pret_envoi" : le cron de 20h se charge ensuite de l'envoi groupé.
export default function ValidationRhPanel() {
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

  function openAttempt(id: string) {
    setOpenId(id);
    setForm(emptyForm);
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
    } catch {
      setStatus("error");
    }
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">
          Validation RH — contrats à préparer
        </h3>
        <p className="mt-1 font-sans text-xs text-white/50">
          Évaluations corrigées, en attente de validation avant l&apos;envoi groupé de 20h.
        </p>

        <div className="mt-4 space-y-2">
          {attempts === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
          {attempts === "erreur" && (
            <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>
          )}
          {Array.isArray(attempts) && attempts.length === 0 && (
            <p className="font-sans text-sm text-white/50">Rien en attente de validation.</p>
          )}
          {Array.isArray(attempts) &&
            attempts.map((a) => (
              <div key={a.id}>
                <button
                  onClick={() => openAttempt(a.id)}
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
                    <span className="block font-mono text-[11px] text-white/40">
                      {a.tier ?? "—"} · {a.totalScore ?? "—"}/100
                    </span>
                  </span>
                  <span className="font-mono text-xs text-accent">
                    {openId === a.id ? "Ouvert" : "Valider"}
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
                    <div className="mt-3 flex items-center gap-3">
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
                        {status === "saving" ? "Génération..." : "Valider et générer le PDF"}
                      </Button>
                      <Button variant="ghostDark" onClick={() => setOpenId(null)}>
                        Annuler
                      </Button>
                    </div>
                    {status === "error" && (
                      <p className="mt-2 font-mono text-xs text-accent">Erreur — réessayer.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </Reveal>
  );
}
