"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface DetailSuperviseur {
  matricule: string;
  prenom: string;
  nom: string;
  clients: string[];
  agentsActifs: number;
  qualityScoreMoyen: number | null;
  tauxAtteinteObjectifs: number | null;
  caAgentsSupervises: number;
  primeSuggeree: number;
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

// Vision micro derrière le poste "Pool Superviseurs" du tableau de bord
// financier — lecture seule : pour quels clients travaille chaque
// superviseur et leur taux d'atteinte des objectifs (qualityScore moyen des
// agents supervisés). Pas de paiement individuel ici : le poste reste une
// ligne globale (voir ProductionService.getDetailPoolSuperviseurs). Rendu
// via portail (même raison que ClientMissionModal).
export default function DetailPoolSuperviseursModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<DetailSuperviseur[] | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<DetailSuperviseur[]>("/production/detail-pool-superviseurs", adminHeaders())
      .then(setData)
      .catch(() => setData("erreur"));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded border border-white/10 bg-obsidianCard p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="font-display text-lg font-semibold text-white">
              Détail — pool des superviseurs
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Traçabilité du poste &quot;Pool Superviseurs&quot; — clients suivis et taux
              d&apos;atteinte des objectifs.
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
          <p className="mt-4 font-sans text-sm text-white/50">Aucun superviseur enregistré.</p>
        )}

        {Array.isArray(data) && data.length > 0 && (
          <div className="mt-4 space-y-2">
            {data.map((s) => (
              <div key={s.matricule} className="rounded border border-white/10 bg-obsidian p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-sans text-sm text-white">
                    {s.prenom} {s.nom}
                    <span className="ml-2 font-mono text-[11px] text-white/40">{s.matricule}</span>
                  </p>
                  <span className="font-mono text-xs text-accent">
                    {s.tauxAtteinteObjectifs !== null ? `${s.tauxAtteinteObjectifs}%` : "—"}
                    {s.qualityScoreMoyen !== null && (
                      <span className="ml-1 text-white/40">({s.qualityScoreMoyen}/5)</span>
                    )}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-white/50">
                  {s.agentsActifs} agent{s.agentsActifs > 1 ? "s" : ""} actif
                  {s.agentsActifs > 1 ? "s" : ""}
                  {s.clients.length > 0 && ` · ${s.clients.join(", ")}`}
                </p>
                {s.primeSuggeree > 0 && (
                  <p className="mt-1 font-mono text-[11px] text-success">
                    Prime suggérée : {fmtMontant(s.primeSuggeree)}
                    <span className="text-white/40"> (basée sur {fmtMontant(s.caAgentsSupervises)} de CA supervisé)</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
