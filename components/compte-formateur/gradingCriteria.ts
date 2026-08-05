// Grille de notation pour "Évaluer & Corriger" — critères concrets à
// cocher plutôt qu'une note libre (retour client, 2026-08-05 : "on évalue
// pas n'importe comment, il faut des critères d'évaluation concrets").
// Même esprit que le barème officiel du Bloc 3 mises-en-situation
// (backend/src/evaluation/situations.ts) : 4 critères universels, chacun
// noté sur 4 échelons stricts. Grille distincte de celle du Bloc 3 — ce
// système-ci n'a pas de backend, c'est un outil du Cockpit Formateur
// (démo), pas le module d'évaluation officiel des candidats.
export const GRADING_LEVELS = [
  { key: "0.25", value: 0.25, label: "Insuffisant" },
  { key: "0.5", value: 0.5, label: "Passable" },
  { key: "0.75", value: 0.75, label: "Bon" },
  { key: "1", value: 1, label: "Excellent" },
] as const;

export interface GradingCriterion {
  key: string;
  label: string;
}

export const GRADING_CRITERIA: GradingCriterion[] = [
  { key: "posture", label: "Posture & Empathie professionnelle" },
  { key: "structure", label: "Structure & Logique d'argumentation" },
  { key: "fluidite", label: "Aisance, intonation & fluidité" },
  { key: "vocabulaire", label: "Richesse du vocabulaire & langue" },
];

export function computeScoreOn20(levels: Record<string, number>): number {
  const total = GRADING_CRITERIA.reduce((sum, c) => sum + (levels[c.key] ?? 0), 0);
  return Math.round((total / GRADING_CRITERIA.length) * 20 * 100) / 100;
}
