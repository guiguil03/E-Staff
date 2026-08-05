"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { useRequireRole } from "@/lib/useRequireRole";
import { APPRENANTS, SUBMISSION_QUEUE } from "./exampleData";
import { GRADING_CRITERIA, GRADING_LEVELS, computeScoreOn20 } from "./gradingCriteria";

// Page dédiée "Évaluer & Corriger" — file d'attente des rendus + espace de
// notation rapide. Notation par grille de critères à cocher (4 critères ×
// 4 échelons), pas une note libre — retour client 2026-08-05. Pas de
// backend de dépôt/notation d'exercices libres pour l'instant (distinct du
// module Bloc 3 mises-en-situation, qui lui a un vrai backend) : la
// notation ici reste en état local, non persistée.
export default function CorrigerDashboard() {
  const checked = useRequireRole("formateur");
  const [queue, setQueue] = useState(SUBMISSION_QUEUE);
  const [openId, setOpenId] = useState<string | null>(null);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  function openItem(id: string) {
    setOpenId(id);
    setLevels({});
    setFeedback("");
  }

  function validate() {
    setQueue((q) => q.filter((item) => item.id !== openId));
    setOpenId(null);
  }

  const openItemData = queue.find((i) => i.id === openId);
  const openApprenant = openItemData
    ? APPRENANTS.find((a) => a.id === openItemData.apprenantId)
    : null;
  const allSelected = GRADING_CRITERIA.every((c) => levels[c.key] !== undefined);
  const score = computeScoreOn20(levels);

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
                        {item.type} · {item.soumisDepuis}
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
                  {openItemData.type} — {openItemData.exercice}
                </p>

                <div className="mt-4 flex h-28 items-center justify-center rounded border border-dashed border-white/15 font-mono text-[11px] uppercase tracking-widest text-white/30">
                  Aperçu {openItemData.type.toLowerCase()} — bientôt disponible
                </div>

                <div className="mt-5 space-y-4">
                  {GRADING_CRITERIA.map((c) => {
                    const selectedKey =
                      levels[c.key] !== undefined
                        ? GRADING_LEVELS.find((l) => l.value === levels[c.key])?.key
                        : undefined;
                    return (
                      <div key={c.key}>
                        <p className="font-sans text-sm text-white/90">{c.label}</p>
                        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {GRADING_LEVELS.map((level) => (
                            <label
                              key={level.key}
                              className={`cursor-pointer rounded border px-2 py-1.5 text-center text-xs transition-colors ${
                                selectedKey === level.key
                                  ? "border-accent bg-accent/10 text-accent"
                                  : "border-white/15 text-white/70 hover:border-white/30"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`${openId}-${c.key}`}
                                className="sr-only"
                                checked={selectedKey === level.key}
                                onChange={() =>
                                  setLevels((prev) => ({ ...prev, [c.key]: level.value }))
                                }
                              />
                              {level.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-white/50">
                  Note calculée : {allSelected ? score : "—"} / 20
                </p>

                <label
                  className="mt-4 block font-sans text-xs text-white/70"
                  htmlFor="grade-feedback"
                >
                  Feedback
                </label>
                <textarea
                  id="grade-feedback"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                />

                <div className="mt-4">
                  <Button variant="dark" onClick={validate} disabled={!allSelected}>
                    Valider la note
                  </Button>
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
