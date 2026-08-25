"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface Vague {
  label: string;
  typeCours: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  apprenantsCount: number;
  tauxReussite: number;
}

interface FormateurCasier {
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  vagues: Vague[];
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// Casier formateur côté RH — état actuel (vagues encadrées, taux de
// réussite réel par vague) plutôt qu'un journal des réaffectations
// passées : aucune table d'historique n'existe pour Groupe.formateurId
// (voir RhService.getFormateurCasier).
export default function FormateurCasierPanel({ id }: { id: string }) {
  const [casier, setCasier] = useState<FormateurCasier | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<FormateurCasier>(`/rh/formateurs/${id}/casier`, adminHeaders())
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
          <h3 className="font-display text-base font-semibold text-white">Vagues encadrées</h3>
          <div className="mt-4 space-y-2">
            {casier.vagues.length === 0 && (
              <p className="font-sans text-sm text-white/50">Aucun groupe assigné actuellement.</p>
            )}
            {casier.vagues.map((v) => (
              <div key={v.label} className="rounded border border-white/10 bg-obsidian p-3">
                <p className="font-sans text-sm text-white">
                  {v.label}
                  {v.typeCours && <span className="text-white/50"> — {v.typeCours}</span>}
                </p>
                <p className="mt-1 font-mono text-[11px] text-white/40">
                  {fmtDate(v.dateDebut)} → {fmtDate(v.dateFin)} · {v.apprenantsCount} apprenant
                  {v.apprenantsCount > 1 ? "s" : ""}
                </p>
                <p className="mt-1 font-mono text-xs text-accent">
                  Taux de réussite : {v.tauxReussite}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
