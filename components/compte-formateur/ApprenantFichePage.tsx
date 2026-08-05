"use client";

import Link from "next/link";
import Reveal from "@/components/Reveal";
import CompetencyBars from "@/components/compte-apprenant/CompetencyBars";
import ComparativeChart from "@/components/compte-apprenant/ComparativeChart";
import { useRequireRole } from "@/lib/useRequireRole";
import { APPRENANTS, SUBMISSION_QUEUE } from "./exampleData";

interface ApprenantFichePageProps {
  apprenantId: string;
}

// Page dédiée "Fiche apprenant" — informations, historique et compétences
// d'un apprenant, accessible depuis le cockpit (groupe, vivier C1,
// recherche). Page à part plutôt que panneau embarqué : contenu trop
// riche pour rester en overlay (même logique que /compte/formateur/corriger).
export default function ApprenantFichePage({ apprenantId }: ApprenantFichePageProps) {
  const checked = useRequireRole("formateur");

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  const apprenant = APPRENANTS.find((a) => a.id === apprenantId);

  if (!apprenant) {
    return (
      <div className="min-h-screen bg-obsidian px-4 py-14 text-center">
        <p className="font-sans text-sm text-white/60">Apprenant introuvable.</p>
        <Link href="/compte/formateur" className="mt-3 inline-block text-accent hover:underline">
          ← Retour au cockpit
        </Link>
      </div>
    );
  }

  const rendus = SUBMISSION_QUEUE.filter((s) => s.apprenantId === apprenantId);

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
                {apprenant.firstName} {apprenant.lastName}
              </h1>
              <p className="mt-1 font-sans text-sm text-white/60">
                Groupe {apprenant.groupe}
                {apprenant.alerteDecrochage && (
                  <span className="ml-2 rounded-full border border-teal px-2 py-0.5 font-mono text-[10px] uppercase text-teal">
                    Alerte décrochage
                  </span>
                )}
              </p>
            </div>
            <p className="font-display text-3xl font-bold text-accent">
              {apprenant.moyenneGlobale}
              <span className="text-base font-normal text-white/40">/100</span>
            </p>
          </div>
        </Reveal>

        <Reveal delay={40}>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded border border-white/10 bg-obsidianCard p-3 text-center">
              <p className="font-mono text-xs text-white/50">Groupe</p>
              <p className="mt-1 font-display text-lg font-bold text-white">
                {apprenant.groupe}
              </p>
            </div>
            <div className="rounded border border-white/10 bg-obsidianCard p-3 text-center">
              <p className="font-mono text-xs text-white/50">Moyenne globale</p>
              <p className="mt-1 font-display text-lg font-bold text-white">
                {apprenant.moyenneGlobale}/100
              </p>
            </div>
            <div className="rounded border border-white/10 bg-obsidianCard p-3 text-center">
              <p className="font-mono text-xs text-white/50">Taux d&apos;absence</p>
              <p className="mt-1 font-display text-lg font-bold text-white">
                {apprenant.tauxAbsence}%
              </p>
            </div>
            <div className="rounded border border-white/10 bg-obsidianCard p-3 text-center">
              <p className="font-mono text-xs text-white/50">Retards</p>
              <p className="mt-1 font-display text-lg font-bold text-white">
                {apprenant.retards}
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <CompetencyBars title="Compétences" competencies={apprenant.competencies} />
          <ComparativeChart
            points={apprenant.history.map((h) => ({ label: h.label, value: h.moyenne }))}
            niveauInitial={apprenant.history[0].moyenne}
          />
        </div>

        <Reveal delay={80}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            <p className="font-sans text-sm font-semibold text-white">
              Rendus en attente ({rendus.length})
            </p>
            {rendus.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {rendus.map((r) => (
                  <li
                    key={r.id}
                    className="rounded border border-white/10 bg-obsidian px-3 py-2 font-sans text-sm text-white/80"
                  >
                    {r.type} — {r.exercice}{" "}
                    <span className="font-mono text-xs text-white/40">({r.soumisDepuis})</span>
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
