"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface MissionHistorique {
  agentNom: string;
  agentMatricule: string;
  clientNom: string;
  role: string;
  dateDebut: string;
  dateFin: string | null;
  qualityScore: number | null;
}

interface SuperviseurCasier {
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  missions: MissionHistorique[];
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// Casier superviseur côté RH — historique complet des agents supervisés
// (voir ProductionService.getSuperviseurCasier), missions actives et
// terminées confondues.
export default function SuperviseurCasierPanel({ id }: { id: string }) {
  const [casier, setCasier] = useState<SuperviseurCasier | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<SuperviseurCasier>(`/production/superviseurs/${id}/casier`, adminHeaders())
      .then(setCasier)
      .catch(() => setCasier("erreur"));
  }, [id]);

  if (casier === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (casier === "erreur")
    return <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <p className="font-display text-lg font-semibold text-white">
            {casier.prenom} {casier.nom}
          </p>
          <p className="font-mono text-xs text-white/40">
            {casier.matricule} · {casier.email}
          </p>
        </div>
      </Reveal>

      <Reveal delay={40}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Agents supervisés</h3>
          <div className="mt-4 space-y-2">
            {casier.missions.length === 0 && (
              <p className="font-sans text-sm text-white/50">Aucun agent supervisé pour l&apos;instant.</p>
            )}
            {casier.missions.map((m, i) => (
              <div key={i} className="rounded border border-white/10 bg-obsidian p-3">
                <p className="font-sans text-sm text-white">
                  {m.agentNom}
                  <span className="ml-2 font-mono text-[11px] text-white/40">{m.agentMatricule}</span>
                  {m.dateFin === null && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-success">
                      Active
                    </span>
                  )}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-white/50">
                  {m.role} · {m.clientNom}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-white/40">
                  {fmtDate(m.dateDebut)} → {fmtDate(m.dateFin)}
                  {m.qualityScore !== null && ` · QS ${m.qualityScore}/5`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
