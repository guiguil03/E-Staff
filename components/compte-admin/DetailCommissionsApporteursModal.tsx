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

interface ApporteurCombine {
  connecteurId: string;
  nom: string;
  clientsApportes: { clientNom: string; ca: number }[];
  commissionRecurrente: number;
  agentsParClient: { clientNom: string; agents: AgentActif[]; sousTotal: number }[];
  demarrages: CommissionDemarrage[];
  totalNet: number;
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Vision micro derrière le poste "Commissions Apporteurs d'Affaires" —
// combine les deux mécanismes (voir ProductionService) en une carte par
// apporteur, comme la maquette "FENÊTRE DÉTAILLÉE : COMMISSIONS APPORTEURS
// D'AFFAIRES" :
//  - récurrente (5% par défaut) sur la masse salariale des agents ACTIFS
//    (Apprenant.connecteurId + statutAgent) — informative, le paiement
//    effectif reste géré via le poste global.
//  - démarrage (10%, une fois par contrat, ContratB2B.connecteurId) — a son
//    propre statut, payable directement ici.
// Rendu via portail (même raison que ClientMissionModal).
export default function DetailCommissionsApporteursModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<ApporteurCombine[] | "loading" | "erreur">("loading");
  const [payingId, setPayingId] = useState<string | null>(null);

  function refresh() {
    Promise.all([
      apiGet<CommissionRecurrente[]>("/production/commissions-apporteurs", adminHeaders()),
      apiGet<CommissionDemarrage[]>("/production/commissions-demarrage", adminHeaders()),
    ])
      .then(([recurrentes, demarrages]) => {
        const parApporteur = new Map<string, ApporteurCombine>();

        for (const r of recurrentes) {
          const agentsParClient = new Map<string, AgentActif[]>();
          for (const a of r.agentsActifs) {
            const list = agentsParClient.get(a.clientNom) ?? [];
            list.push(a);
            agentsParClient.set(a.clientNom, list);
          }
          parApporteur.set(r.connecteurId, {
            connecteurId: r.connecteurId,
            nom: r.nom,
            clientsApportes: [],
            commissionRecurrente: r.commission,
            agentsParClient: Array.from(agentsParClient.entries()).map(([clientNom, agents]) => ({
              clientNom,
              agents,
              sousTotal: round2(agents.reduce((sum, a) => sum + a.montantBase, 0)),
            })),
            demarrages: [],
            totalNet: r.commission,
          });
        }

        for (const d of demarrages) {
          if (!d.connecteurNom) continue;
          const existing = Array.from(parApporteur.values()).find((a) => a.nom === d.connecteurNom);
          const entry =
            existing ??
            ({
              connecteurId: `demarrage-only-${d.id}`,
              nom: d.connecteurNom,
              clientsApportes: [],
              commissionRecurrente: 0,
              agentsParClient: [],
              demarrages: [],
              totalNet: 0,
            } satisfies ApporteurCombine);
          entry.demarrages.push(d);
          entry.clientsApportes.push({ clientNom: d.clientNom, ca: d.montant });
          entry.totalNet = round2(
            entry.commissionRecurrente +
              entry.demarrages.filter((x) => x.statut !== "paye").reduce((s, x) => s + x.montant, 0)
          );
          if (!existing) parApporteur.set(entry.connecteurId, entry);
        }

        setData(Array.from(parApporteur.values()));
      })
      .catch(() => setData("erreur"));
  }

  useEffect(refresh, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function payerDemarrage(id: string) {
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
              Traçabilité du poste &quot;Commissions Apporteurs d&apos;Affaires&quot; — commission
              récurrente (masse salariale des agents actifs) + démarrage (une fois par contrat).
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded border border-white/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/50 hover:border-white/30 hover:text-white"
          >
            Fermer
          </button>
        </div>

        {data === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {data === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}
        {Array.isArray(data) && data.length === 0 && (
          <p className="mt-4 font-sans text-sm text-white/50">
            Aucun apporteur avec un agent actif ou un contrat rattaché pour l&apos;instant.
          </p>
        )}

        {Array.isArray(data) && data.length > 0 && (
          <div className="mt-4 space-y-3">
            {data.map((a) => {
              const demarrageEnAttente = a.demarrages.filter((d) => d.statut !== "paye");
              return (
                <div key={a.connecteurId} className="rounded border border-white/10 bg-obsidian p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-sans text-sm text-white">{a.nom}</p>
                    <p className="font-mono text-sm font-semibold text-accent">
                      Total net : {fmtMontant(a.totalNet)}
                    </p>
                  </div>

                  {a.agentsParClient.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        Comm. récurrente ({fmtMontant(a.commissionRecurrente)}) — agents actifs
                      </p>
                      {a.agentsParClient.map((c) => (
                        <p key={c.clientNom} className="font-mono text-[11px] text-white/60">
                          {c.clientNom} : {c.agents.length} agent{c.agents.length > 1 ? "s" : ""} (
                          {fmtMontant(c.sousTotal)})
                        </p>
                      ))}
                    </div>
                  )}

                  {a.demarrages.length > 0 && (
                    <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        Comm. démarrage (10%)
                      </p>
                      {a.demarrages.map((d) => (
                        <div key={d.id} className="flex items-center justify-between gap-2">
                          <p className="font-mono text-[11px] text-white/60">
                            {d.clientNom} : {fmtMontant(d.montant)}
                          </p>
                          {d.statut === "paye" ? (
                            <span className="rounded-full border border-success/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-success">
                              Payée
                            </span>
                          ) : (
                            <button
                              onClick={() => payerDemarrage(d.id)}
                              disabled={payingId === d.id}
                              className="rounded border border-accent/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
                            >
                              {payingId === d.id ? "..." : "Valider & Payer"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {demarrageEnAttente.length === 0 && a.demarrages.length > 0 && (
                    <p className="mt-1 font-mono text-[10px] text-white/40">
                      Toutes les commissions de démarrage sont réglées.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
