"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useRequireRole } from "@/lib/useRequireRole";
import { APPRENANTS, SUBMISSION_QUEUE } from "./exampleData";
import {
  COMPETENCY_DEFS,
  EXPRESSION_ORALE_CRITERIA,
  EXPRESSION_ORALE_MAX,
  EXPRESSION_ECRITE_CRITERIA,
  EXPRESSION_ECRITE_MAX,
  EXPRESSION_ECRITE_ANOMALIES,
} from "./gradingGrids";
import DelfGrid from "./grids/DelfGrid";
import PostureGrid from "./grids/PostureGrid";

// Page dédiée "Évaluer & Corriger" — file d'attente des rendus d'apprenants
// déjà inscrits (vidéo/audio/texte pendant leur cursus). Distinct du test
// d'admission avant compte (module /evaluation, backend séparé). Notation
// avec les mêmes grilles DELF que la notation de séance (Planning > Noter,
// voir gradingGrids.ts) plutôt qu'une grille générique séparée — un même
// rendu "pitch de présentation" et une séance d'expression orale utilisent
// désormais exactement le même barème. Pas de backend de dépôt/notation
// d'exercices libres pour l'instant : la notation ici reste en état local,
// non persistée.
export default function CorrigerDashboard() {
  const checked = useRequireRole("formateur");
  const [queue, setQueue] = useState(SUBMISSION_QUEUE);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  function openItem(id: string) {
    setOpenId(id);
  }

  function handleSave() {
    setQueue((q) => q.filter((item) => item.id !== openId));
    setOpenId(null);
  }

  const openItemData = queue.find((i) => i.id === openId);
  const openApprenant = openItemData
    ? APPRENANTS.find((a) => a.id === openItemData.apprenantId)
    : null;
  const competenceLabel = openItemData
    ? COMPETENCY_DEFS.find((c) => c.key === openItemData.competence)?.label
    : undefined;

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
          <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            Évaluer &amp; Corriger
          </h1>
          <p className="mt-1 font-sans text-sm text-white/60">
            {queue.length} rendu{queue.length > 1 ? "s" : ""} en attente
          </p>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          <Reveal>
            <div className="space-y-2">
              {queue.map((item) => {
                const apprenant = APPRENANTS.find((a) => a.id === item.apprenantId);
                const label = COMPETENCY_DEFS.find((c) => c.key === item.competence)?.label;
                return (
                  <button
                    key={item.id}
                    onClick={() => openItem(item.id)}
                    className={`flex w-full items-center justify-between rounded border px-3 py-2.5 text-left transition-colors ${
                      openId === item.id
                        ? "border-accent bg-obsidianCard"
                        : "border-white/10 bg-obsidianCard hover:border-accent/50"
                    }`}
                  >
                    <span>
                      <span className="block font-sans text-sm text-white">
                        {apprenant?.firstName} {apprenant?.lastName}
                      </span>
                      <span className="block font-mono text-[11px] text-white/40">
                        {item.type} · {label} · {item.soumisDepuis}
                      </span>
                    </span>
                  </button>
                );
              })}
              {queue.length === 0 && (
                <p className="rounded border border-white/10 bg-obsidianCard p-4 font-sans text-sm text-white/50">
                  Tous les rendus ont été corrigés.
                </p>
              )}
            </div>
          </Reveal>

          <Reveal delay={60}>
            {openItemData && openApprenant ? (
              <div className="rounded border border-accent/30 bg-obsidianCard p-6">
                <p className="font-sans text-sm font-semibold text-white">
                  {openApprenant.firstName} {openApprenant.lastName} —{" "}
                  <span className="text-white/60">Groupe {openApprenant.groupe}</span>
                </p>
                <p className="font-sans text-xs text-white/60">
                  {openItemData.type} — {openItemData.exercice} · {competenceLabel}
                </p>

                <div className="mt-4 flex h-28 items-center justify-center rounded border border-dashed border-white/15 font-mono text-[11px] uppercase tracking-widest text-white/30">
                  Aperçu {openItemData.type.toLowerCase()} — bientôt disponible
                </div>

                <div className="mt-5">
                  {openItemData.competence === "expression_orale" && (
                    <DelfGrid
                      criteria={EXPRESSION_ORALE_CRITERIA}
                      maxRaw={EXPRESSION_ORALE_MAX}
                      onSave={handleSave}
                      onCancel={() => setOpenId(null)}
                    />
                  )}
                  {openItemData.competence === "expression_ecrite" && (
                    <DelfGrid
                      criteria={EXPRESSION_ECRITE_CRITERIA}
                      maxRaw={EXPRESSION_ECRITE_MAX}
                      anomalies={EXPRESSION_ECRITE_ANOMALIES}
                      onSave={handleSave}
                      onCancel={() => setOpenId(null)}
                    />
                  )}
                  {openItemData.competence === "posture_eloquence" && (
                    <PostureGrid onSave={handleSave} onCancel={() => setOpenId(null)} />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded border border-dashed border-white/10 p-10 text-center">
                <p className="font-sans text-sm text-white/50">
                  Sélectionnez un rendu à gauche pour l&apos;évaluer.
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </div>
  );
}
