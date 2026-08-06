"use client";

import { useSyncExternalStore } from "react";
import type { PostureAdjustments, CompetencyKey } from "./gradingGrids";

export interface GridCompetencyEntry {
  kind: "grid";
  selections: Record<string, number | undefined>;
  anomaly?: string; // Expression Écrite uniquement
  adjustments?: PostureAdjustments; // Posture & Éloquence uniquement
  comments: string;
  scoreOn20: number | null;
}

export interface UploadCompetencyEntry {
  kind: "upload";
  fileName: string | null;
  note: number | null;
  scoreOn20: number | null;
}

export type CompetencyEntry = GridCompetencyEntry | UploadCompetencyEntry;

// Store externe minimal (pas de backend, pas de lib d'état) partagé entre
// le tableau récap de Planning et la page dédiée de notation
// (/compte/formateur/planning/noter/[apprenantId]) — le state doit survivre
// à la navigation client-side entre ces deux routes, ce qu'un simple
// useState local ne permettrait pas (démonté au changement de route).
// Perdu au rechargement complet de page, comme le reste du cockpit
// formateur (pas de persistance réelle pour ce module).
const entries = new Map<string, CompetencyEntry>();
const listeners = new Set<() => void>();
let version = 0;

function keyFor(seance: number, apprenantId: string, competencyKey: CompetencyKey): string {
  return `${seance}:${apprenantId}:${competencyKey}`;
}

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCompetencyEntry(
  seance: number,
  apprenantId: string,
  competencyKey: CompetencyKey
): CompetencyEntry | undefined {
  return entries.get(keyFor(seance, apprenantId, competencyKey));
}

export function setCompetencyEntry(
  seance: number,
  apprenantId: string,
  competencyKey: CompetencyKey,
  entry: CompetencyEntry
) {
  entries.set(keyFor(seance, apprenantId, competencyKey), entry);
  notify();
}

// Ne renvoie qu'un compteur de version : sert uniquement à déclencher un
// re-render quand le store change ailleurs (les composants relisent
// ensuite getCompetencyEntry directement dans leur rendu).
export function usePlanningGradesVersion(): number {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => 0
  );
}
