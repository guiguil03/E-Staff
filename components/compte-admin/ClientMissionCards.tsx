"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import ClientMissionModal from "./ClientMissionModal";
import { adminHeaders } from "./adminHeaders";

interface CarteMissionClient {
  contratId: string;
  clientNom: string;
  intitule: string | null;
  superviseurNom: string | null;
  objectifPct: number | null;
  agentsActifs: number;
}

function GaugeRing({ value }: { value: number | null }) {
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const pct = value !== null ? Math.max(0, Math.min(100, value)) : 0;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 52 52" className="h-14 w-14 -rotate-90">
        <circle cx="26" cy="26" r={r} className="fill-none stroke-white/10" strokeWidth={5} />
        {value !== null && (
          <circle
            cx="26"
            cy="26"
            r={r}
            className="fill-none stroke-accent"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-white">
        {value !== null ? `${value}%` : "—"}
      </span>
    </div>
  );
}

// Cartes Mission/Client — remplace les 4 cartes KPI génériques de la vue
// d'ensemble Production par une carte par contrat B2B actif : client,
// intitulé de la mission, superviseur principal et jauge d'objectif. Le
// clic ouvre le détail à 3 onglets (ClientMissionModal). Voir
// ProductionService.getCartesMissionClient.
export default function ClientMissionCards() {
  const [cartes, setCartes] = useState<CarteMissionClient[] | "loading" | "erreur">("loading");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    apiGet<CarteMissionClient[]>("/production/cartes-mission-client", adminHeaders())
      .then(setCartes)
      .catch(() => setCartes("erreur"));
  }, []);

  if (cartes === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (cartes === "erreur")
    return <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>;
  if (cartes.length === 0)
    return <p className="font-sans text-sm text-white/50">Aucun contrat actif pour l&apos;instant.</p>;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartes.map((c) => (
          <button
            key={c.contratId}
            onClick={() => setOpenId(c.contratId)}
            className="rounded border border-white/10 bg-obsidianCard p-5 text-left transition-colors hover:border-accent/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-sans text-sm font-semibold text-white">{c.clientNom}</p>
                <p className="mt-0.5 truncate font-sans text-xs text-white/60">
                  {c.intitule ?? "Mission sans intitulé"}
                </p>
                <p className="mt-2 font-mono text-[11px] text-white/40">
                  {c.superviseurNom ?? "Sans superviseur"}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-white/40">
                  {c.agentsActifs} agent{c.agentsActifs > 1 ? "s" : ""} en mission
                </p>
              </div>
              <GaugeRing value={c.objectifPct} />
            </div>
          </button>
        ))}
      </div>

      {openId && <ClientMissionModal contratId={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}
