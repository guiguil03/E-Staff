"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface AgentActif {
  agentNom: string;
  agentMatricule: string;
  clientNom: string;
  montantBase: number;
}

interface CommissionRecurrente {
  connecteurId: string;
  nom: string;
  agentsActifs: AgentActif[];
  masseSalariale: number;
  commission: number;
}

interface CommissionDemarrage {
  id: string;
  contratId: string;
  clientNom: string;
  connecteurNom: string | null;
  montant: number;
  statut: string;
  datePaiement: string | null;
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// Vision micro derrière le poste "Commissions Apporteurs d'Affaires" du
// tableau de bord financier — deux mécanismes distincts (voir
// ProductionService) :
//  - récurrente (5% par défaut) sur la masse salariale des agents ACTIFS
//    apportés par chaque connecteur (Apprenant.connecteurId +
//    Apprenant.statutAgent) — s'arrête automatiquement si l'agent n'est
//    plus "actif" ; informatif ici, le paiement effectif reste géré via le
//    poste global.
//  - démarrage (10%, une fois) déclenchée dès qu'un contrat a un apporteur
//    rattaché (ContratB2B.connecteurId) — a son propre statut de paiement,
//    payable directement depuis cette modale.
// Rendu via portail (même raison que ClientMissionModal).
export default function DetailCommissionsApporteursModal({ onClose }: { onClose: () => void }) {
  const [recurrentes, setRecurrentes] = useState<CommissionRecurrente[] | "loading" | "erreur">(
    "loading"
  );
  const [demarrage, setDemarrage] = useState<CommissionDemarrage[] | "loading" | "erreur">(
    "loading"
  );
  const [payingId, setPayingId] = useState<string | null>(null);

  function refresh() {
    apiGet<CommissionRecurrente[]>("/production/commissions-apporteurs", adminHeaders())
      .then(setRecurrentes)
      .catch(() => setRecurrentes("erreur"));
    apiGet<CommissionDemarrage[]>("/production/commissions-demarrage", adminHeaders())
      .then(setDemarrage)
      .catch(() => setDemarrage("erreur"));
  }

  useEffect(refresh, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function payer(id: string) {
    setPayingId(id);
    try {
      await apiPostAuthed(`/production/commissions-demarrage/${id}/payer`, {}, adminHeaders());
      refresh();
    } finally {
      setPayingId(null);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded border border-white/10 bg-obsidianCard p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="font-display text-lg font-semibold text-white">
              Détail — commissions apporteurs d&apos;affaires
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Traçabilité du poste &quot;Commissions Apporteurs d&apos;Affaires&quot;.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded border border-white/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/50 hover:border-white/30 hover:text-white"
          >
            Fermer
          </button>
        </div>

        <div className="mt-4">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-white/50">
            Commission récurrente — masse salariale des agents actifs
          </p>
          {recurrentes === "loading" && (
            <p className="mt-3 font-sans text-xs text-white/50">Chargement...</p>
          )}
          {recurrentes === "erreur" && (
            <p className="mt-3 font-sans text-xs text-white/50">Erreur de chargement.</p>
          )}
          {Array.isArray(recurrentes) && recurrentes.length === 0 && (
            <p className="mt-3 font-sans text-xs text-white/50">
              Aucun apporteur avec un agent actif rattaché pour l&apos;instant.
            </p>
          )}
          {Array.isArray(recurrentes) && recurrentes.length > 0 && (
            <div className="mt-3 space-y-2">
              {recurrentes.map((r) => (
                <div key={r.connecteurId} className="rounded border border-white/10 bg-obsidian p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-sans text-sm text-white">{r.nom}</p>
                    <span className="font-mono text-xs text-accent">
                      {fmtMontant(r.commission)}
                      <span className="text-white/40"> ({r.agentsActifs.length} agent{r.agentsActifs.length > 1 ? "s" : ""} actif{r.agentsActifs.length > 1 ? "s" : ""})</span>
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-white/50">
                    Masse salariale : {fmtMontant(r.masseSalariale)}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-white/40">
                    {r.agentsActifs.map((a) => `${a.agentNom} (${a.clientNom})`).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-white/50">
            Commission de démarrage — une fois par contrat
          </p>
          {demarrage === "loading" && (
            <p className="mt-3 font-sans text-xs text-white/50">Chargement...</p>
          )}
          {demarrage === "erreur" && (
            <p className="mt-3 font-sans text-xs text-white/50">Erreur de chargement.</p>
          )}
          {Array.isArray(demarrage) && demarrage.length === 0 && (
            <p className="mt-3 font-sans text-xs text-white/50">
              Aucun contrat actif rattaché à un apporteur pour l&apos;instant.
            </p>
          )}
          {Array.isArray(demarrage) && demarrage.length > 0 && (
            <div className="mt-3 space-y-2">
              {demarrage.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-obsidian px-4 py-3"
                >
                  <div>
                    <p className="font-sans text-sm text-white">{d.clientNom}</p>
                    <p className="font-mono text-[11px] text-white/40">
                      {d.connecteurNom ?? "—"} · {fmtMontant(d.montant)}
                      {d.datePaiement && ` · payée le ${fmtDate(d.datePaiement)}`}
                    </p>
                  </div>
                  {d.statut === "paye" ? (
                    <span className="rounded-full border border-success/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-success">
                      Payée
                    </span>
                  ) : (
                    <button
                      onClick={() => payer(d.id)}
                      disabled={payingId === d.id}
                      className="rounded border border-accent/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
                    >
                      {payingId === d.id ? "..." : "Marquer payée"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
