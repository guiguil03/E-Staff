"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface Vague {
  id: string;
  cle: string;
  label: string;
  typeCours: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  statut: "active" | "cloturee";
  formateurNom: string | null;
  apprenantsCount: number;
  tauxReussite: number;
  scoreEloquenceMoyen: number | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

function tauxColor(taux: number): string {
  if (taux >= 60) return "text-success";
  if (taux >= 30) return "text-accent";
  return "text-white/50";
}

// Vagues clôturées (dateFin passée — même statut que RhService.getVagues),
// groupées par formateur, avec le comparatif taux de réussite + score
// éloquence moyen (CockpitService.getEloquenceParGroupe). Remplace le
// panneau "Coming Soon" du même nom : les données existaient déjà
// (Groupe.dateFin, Notation par compétence), il ne manquait que cette vue —
// pas d'archivage séparé nécessaire tant qu'une vague close garde sa propre
// ligne Groupe (voir schema.prisma).
export default function HistoriqueVaguesPanel() {
  const [vagues, setVagues] = useState<Vague[] | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<Vague[]>("/rh/vagues", adminHeaders())
      .then(setVagues)
      .catch(() => setVagues("erreur"));
  }, []);

  if (vagues === "loading") {
    return (
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">Historique des vagues</h3>
        <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }
  if (vagues === "erreur") {
    return (
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">Historique des vagues</h3>
        <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
      </div>
    );
  }

  const clotureesTriees = vagues
    .filter((v) => v.statut === "cloturee")
    .sort((a, b) => (a.formateurNom ?? "").localeCompare(b.formateurNom ?? "") || (b.dateFin ?? "").localeCompare(a.dateFin ?? ""));

  return (
    <Reveal delay={40}>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">Historique des vagues</h3>
        <p className="mt-1 font-sans text-xs text-white/50">
          Vagues clôturées, par formateur — comparatif taux de réussite et score éloquence moyen.
        </p>

        {clotureesTriees.length === 0 ? (
          <p className="mt-4 font-sans text-sm text-white/50">Aucune vague clôturée pour le moment.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-widest text-white/40">
                  <th className="py-2 pr-4">Formateur</th>
                  <th className="py-2 pr-4">Vague</th>
                  <th className="py-2 pr-4">Type de cours</th>
                  <th className="py-2 pr-4">Période</th>
                  <th className="py-2 pr-4">Taux de réussite</th>
                  <th className="py-2 pr-4">Éloquence moy.</th>
                </tr>
              </thead>
              <tbody>
                {clotureesTriees.map((v) => (
                  <tr key={v.id} className="border-b border-white/5">
                    <td className="py-2.5 pr-4 font-sans text-xs text-white/60">{v.formateurNom ?? "—"}</td>
                    <td className="py-2.5 pr-4 font-sans text-sm text-white">
                      {v.label}
                      <span className="ml-1.5 font-mono text-[11px] text-white/40">({v.apprenantsCount})</span>
                    </td>
                    <td className="py-2.5 pr-4 font-sans text-xs text-white/60">{v.typeCours ?? "—"}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-white/60">
                      {fmtDate(v.dateDebut)} → {fmtDate(v.dateFin)}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono text-xs ${tauxColor(v.tauxReussite)}`}>
                      {v.tauxReussite}%
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-white/60">
                      {v.scoreEloquenceMoyen === null ? "—" : `${v.scoreEloquenceMoyen}/20`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Reveal>
  );
}
