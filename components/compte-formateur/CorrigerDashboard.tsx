"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet, apiGetBlob, apiPut, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { COMPETENCY_DEFS } from "./gradingGrids";
import {
  EXPRESSION_ORALE_CRITERIA,
  EXPRESSION_ORALE_MAX,
  EXPRESSION_ECRITE_CRITERIA,
  EXPRESSION_ECRITE_MAX,
  EXPRESSION_ECRITE_ANOMALIES,
} from "./gradingGrids";
import type { CompetencyEntry } from "./planningGradesStore";
import DelfGrid from "./grids/DelfGrid";
import PostureGrid from "./grids/PostureGrid";

interface ACorrigerItem {
  id: string;
  apprenantMatricule: string;
  apprenantPrenom: string;
  apprenantNom: string;
  groupeCle: string;
  groupeLabel: string;
  numero: number;
  competence: string;
  fileName: string | null;
  soumisAt: string | null;
}

const VIDEO_EXT = [".mp4", ".webm", ".mov", ".mkv"];

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function isVideo(fileName: string | null): boolean {
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return VIDEO_EXT.some((ext) => lower.endsWith(ext));
}

// Page dédiée "Évaluer & Corriger" — file d'attente des devoirs déposés par
// les apprenants (voir Compte Apprenant > tableau des séances). Distinct du
// test d'admission avant compte (module /evaluation, backend séparé).
// Notation avec les mêmes grilles DELF que la notation de séance (Planning
// > Noter, voir gradingGrids.ts) — un même rendu "pitch de présentation" et
// une séance d'expression orale utilisent exactement le même barème, et
// écrivent dans la même table Notation. Persisté en base depuis le
// 2026-08-07 (auparavant file d'attente fictive, non connectée à un vrai
// dépôt apprenant).
export default function CorrigerDashboard() {
  const checked = useRequireRole("formateur");
  const [queue, setQueue] = useState<ACorrigerItem[] | "loading" | "erreur">("loading");
  const [openId, setOpenId] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  function refresh() {
    setQueue("loading");
    apiGet<ACorrigerItem[]>("/notations/a-corriger", formateurHeaders())
      .then(setQueue)
      .catch((err) => setQueue(err instanceof ApiError ? [] : "erreur"));
  }

  useEffect(() => {
    if (!checked) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  const openItemData = Array.isArray(queue) ? queue.find((i) => i.id === openId) : undefined;

  useEffect(() => {
    if (!openItemData) {
      setMediaUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    apiGetBlob(`/notations/${openItemData.id}/devoir`, formateurHeaders())
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setMediaUrl(objectUrl);
      })
      .catch(() => setMediaUrl(null));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openItemData?.id]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  async function handleSave(entry: CompetencyEntry) {
    if (!openItemData) return;
    const payload =
      entry.kind === "grid"
        ? {
            gridData: {
              selections: entry.selections,
              anomaly: entry.anomaly,
              adjustments: entry.adjustments,
            },
            commentaires: entry.comments,
            scoreOn20: entry.scoreOn20,
          }
        : { note: entry.note, scoreOn20: entry.scoreOn20 };

    await apiPut(
      `/notations/${openItemData.groupeCle}/${openItemData.numero}/${openItemData.apprenantMatricule}/${openItemData.competence}`,
      payload,
      formateurHeaders()
    );
    setOpenId(null);
    refresh();
  }

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
            {Array.isArray(queue) ? `${queue.length} rendu${queue.length > 1 ? "s" : ""} en attente` : ""}
          </p>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          <Reveal>
            <div className="space-y-2">
              {queue === "loading" && (
                <p className="font-sans text-sm text-white/50">Chargement...</p>
              )}
              {queue === "erreur" && (
                <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>
              )}
              {Array.isArray(queue) &&
                queue.map((item) => {
                  const label = COMPETENCY_DEFS.find((c) => c.key === item.competence)?.label;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setOpenId(item.id)}
                      className={`flex w-full items-center justify-between rounded border px-3 py-2.5 text-left transition-colors ${
                        openId === item.id
                          ? "border-accent bg-obsidianCard"
                          : "border-white/10 bg-obsidianCard hover:border-accent/50"
                      }`}
                    >
                      <span>
                        <span className="block font-sans text-sm text-white">
                          {item.apprenantPrenom} {item.apprenantNom}
                        </span>
                        <span className="block font-mono text-[11px] text-white/40">
                          {label} · {item.groupeLabel} n°{item.numero}
                        </span>
                      </span>
                    </button>
                  );
                })}
              {Array.isArray(queue) && queue.length === 0 && (
                <p className="rounded border border-white/10 bg-obsidianCard p-4 font-sans text-sm text-white/50">
                  Tous les rendus ont été corrigés.
                </p>
              )}
            </div>
          </Reveal>

          <Reveal delay={60}>
            {openItemData ? (
              <div className="rounded border border-accent/30 bg-obsidianCard p-6">
                <p className="font-sans text-sm font-semibold text-white">
                  {openItemData.apprenantPrenom} {openItemData.apprenantNom} —{" "}
                  <span className="text-white/60">Groupe {openItemData.groupeCle}</span>
                </p>
                <p className="font-sans text-xs text-white/60">
                  {competenceLabel} — {openItemData.groupeLabel} n°{openItemData.numero}
                </p>

                {mediaUrl ? (
                  isVideo(openItemData.fileName) ? (
                    <video controls src={mediaUrl} className="mt-4 w-full rounded" />
                  ) : (
                    <audio controls src={mediaUrl} className="mt-4 w-full" />
                  )
                ) : (
                  <div className="mt-4 flex h-28 items-center justify-center rounded border border-dashed border-white/15 font-mono text-[11px] uppercase tracking-widest text-white/30">
                    Chargement du fichier...
                  </div>
                )}

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
