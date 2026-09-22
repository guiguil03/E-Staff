"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import CompetencyBars from "@/components/compte-apprenant/CompetencyBars";
import ComparativeChart from "@/components/compte-apprenant/ComparativeChart";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { apprenantMatricule } from "./exampleData";
import { COMPETENCY_DEFS } from "./gradingGrids";

interface ApprenantFichePageProps {
  apprenantId: string;
}

interface RenduEnAttente {
  id: string;
  competence: string;
  numero: number;
  fileName: string | null;
  soumisAt: string | null;
}

interface ApprenantFicheApi {
  matricule: string;
  prenom: string;
  nom: string;
  groupeCle: string;
  moyenneGlobale: number | null;
  tauxAbsence: number | null;
  alerteDecrochage: boolean;
  competencies: { key: string; score: number }[];
  history: { label: string; moyenne: number | null }[];
  rendusEnAttente: RenduEnAttente[];
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

const COMPETENCE_LABELS: Record<string, string> = Object.fromEntries(
  COMPETENCY_DEFS.map((d) => [d.key, d.label])
);

// Page dédiée "Fiche apprenant" — informations, historique et compétences
// d'un apprenant, accessible depuis le cockpit (groupe, vivier C1,
// recherche). Page à part plutôt que panneau embarqué : contenu trop
// riche pour rester en overlay (même logique que /compte/formateur/corriger).
// Branchée sur /cockpit/apprenants/:matricule/fiche depuis le 2026-09-22 —
// tournait avant entièrement sur exampleData.ts (30 faux apprenants).
export default function ApprenantFichePage({ apprenantId }: ApprenantFichePageProps) {
  const checked = useRequireRole("formateur");
  const [fiche, setFiche] = useState<ApprenantFicheApi | null | "loading">("loading");

  const matricule = apprenantMatricule(apprenantId);

  useEffect(() => {
    if (!checked) return;
    apiGet<ApprenantFicheApi>(`/cockpit/apprenants/${matricule}/fiche`, formateurHeaders())
      .then(setFiche)
      .catch(() => setFiche(null));
  }, [checked, matricule]);

  if (!checked || fiche === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  if (!fiche) {
    return (
      <div className="min-h-screen bg-obsidian px-4 py-14 text-center">
        <p className="font-sans text-sm text-white/60">Apprenant introuvable.</p>
        <Link href="/compte/formateur" className="mt-3 inline-block text-accent hover:underline">
          ← Retour au cockpit
        </Link>
      </div>
    );
  }

  const competencies = fiche.competencies.map((c) => ({
    key: c.key,
    label: COMPETENCE_LABELS[c.key] ?? c.key,
    score: c.score,
  }));
  const historyPoints = fiche.history
    .filter((h): h is { label: string; moyenne: number } => h.moyenne !== null)
    .map((h) => ({ label: h.label, value: h.moyenne }));

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/compte/formateur"
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour au cockpit
        </Link>

        <Reveal>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {fiche.prenom} {fiche.nom}
              </h1>
              <p className="mt-1 font-sans text-sm text-white/60">
                Groupe {fiche.groupeCle}
                {fiche.alerteDecrochage && (
                  <span className="ml-2 rounded-full border border-teal px-2 py-0.5 font-mono text-[10px] uppercase text-teal">
                    Alerte décrochage
                  </span>
                )}
              </p>
            </div>
            <p className="font-display text-3xl font-bold text-accent">
              {fiche.moyenneGlobale ?? "—"}
              <span className="text-base font-normal text-white/40">/100</span>
            </p>
          </div>
        </Reveal>

        <Reveal delay={40}>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded border border-white/10 bg-obsidianCard p-3 text-center">
              <p className="font-mono text-xs text-white/50">Groupe</p>
              <p className="mt-1 font-display text-lg font-bold text-white">{fiche.groupeCle}</p>
            </div>
            <div className="rounded border border-white/10 bg-obsidianCard p-3 text-center">
              <p className="font-mono text-xs text-white/50">Moyenne globale</p>
              <p className="mt-1 font-display text-lg font-bold text-white">
                {fiche.moyenneGlobale ?? "—"}/100
              </p>
            </div>
            <div className="rounded border border-white/10 bg-obsidianCard p-3 text-center">
              <p className="font-mono text-xs text-white/50">Taux d&apos;absence</p>
              <p className="mt-1 font-display text-lg font-bold text-white">
                {fiche.tauxAbsence !== null ? `${fiche.tauxAbsence}%` : "—"}
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <CompetencyBars title="Compétences" competencies={competencies} />
          {historyPoints.length > 0 && (
            <ComparativeChart points={historyPoints} niveauInitial={historyPoints[0].value} />
          )}
        </div>

        <Reveal delay={80}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            <p className="font-sans text-sm font-semibold text-white">
              Rendus en attente ({fiche.rendusEnAttente.length})
            </p>
            {fiche.rendusEnAttente.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {fiche.rendusEnAttente.map((r) => (
                  <li
                    key={r.id}
                    className="rounded border border-white/10 bg-obsidian px-3 py-2 font-sans text-sm text-white/80"
                  >
                    {COMPETENCE_LABELS[r.competence] ?? r.competence} — Séance n°{r.numero}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 font-sans text-xs text-white/50">Aucun rendu en attente.</p>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
