// Source de vérité partagée pour les paliers CECR de CecrGauge.tsx — évite
// de dupliquer les bornes (30/45/60/75/90) entre le rendu de la jauge et le
// calcul de la position à afficher.
export const PALIERS = [
  { key: "b1", label: "B1", from: 30, to: 45, colorClass: "stroke-teal" },
  { key: "b2", label: "B2", from: 45, to: 60, colorClass: "stroke-success" },
  { key: "c1", label: "C1", from: 60, to: 75, colorClass: "stroke-accent" },
  { key: "c2", label: "C2", from: 75, to: 90, colorClass: "stroke-accent/50" },
] as const;

export type PalierKey = "pre-b1" | (typeof PALIERS)[number]["key"];

export const PALIER_LABELS: Record<PalierKey, string> = {
  "pre-b1": "Pré-B1",
  b1: "B1",
  b2: "B2",
  c1: "C1",
  c2: "C2",
};

// Chaque palier CECR occupe 15 points sur l'échelle 0-100 de la jauge (Pré-B1
// couvre A1+A2, donc 30 points). Point de départ absolu sur cette échelle
// selon le niveau initial de l'apprenant.
export const NIVEAU_INITIAL_OFFSET: Record<PalierKey, number> = {
  "pre-b1": 0,
  b1: 30,
  b2: 45,
  c1: 60,
  c2: 75,
};

const PALIER_WIDTH = 15;

// Position absolue à afficher sur la jauge (0-100), à partir du niveau
// initial de l'apprenant et de son taux d'évolution CE MOIS (0-100%).
//
// Le taux d'évolution mesure la progression À L'INTÉRIEUR du palier de
// départ, pas une position absolue sur l'échelle globale — un cumul de 50%
// en partant de C1 ne vaut donc que 7,5 pts sur l'échelle (50% × 15), pas
// 50 pts, et 100% d'évolution en partant de B1 amène exactement à B2, jamais
// à C2. (Erreur de calcul relevée par la cliente le 2026-08-16 : la jauge
// synchronisait jusqu'ici le cumul mensuel brut directement sur l'échelle.)
export function computeJaugePosition(
  niveauInitial: PalierKey,
  tauxEvolutionMensuel: number
): number {
  const offset = NIVEAU_INITIAL_OFFSET[niveauInitial];
  const taux = Math.min(100, Math.max(0, tauxEvolutionMensuel));
  return offset + (taux / 100) * PALIER_WIDTH;
}
