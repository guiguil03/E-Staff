// Paliers de notation (cahier des charges, module d'évaluation).
//
// Le barème prévu porte sur 5 épreuves /20 chacune (total /100). 4 épreuves
// ont un contenu défini (lexique, compréhension orale, mises en situation,
// production vidéo — cette dernière en placeholder, voir video-tasks.ts) —
// le Bloc 2 (Commentaire Argumentatif) reste non spécifié. Le score total
// est donc calculé au prorata des épreuves définies (moyenne des scores /20
// renseignés, ramenée sur 100), plutôt que d'inventer du contenu pour
// l'épreuve manquante. À ajuster dès que la cliente précise le Bloc 2.
export type EvaluationTier =
  | "refuse"
  | "formation_b1"
  | "niveau_b2"
  | "niveau_c1"
  | "placement_direct";

export function computeTier(totalScore: number): EvaluationTier {
  if (totalScore <= 30) return "refuse";
  if (totalScore <= 45) return "formation_b1";
  if (totalScore <= 60) return "niveau_b2";
  if (totalScore <= 75) return "niveau_c1";
  return "placement_direct";
}

export function computeTotalScore(
  scoresOn20: Array<number | null | undefined>
): number | null {
  const defined = scoresOn20.filter(
    (s): s is number => typeof s === "number"
  );
  if (defined.length === 0) return null;
  const average = defined.reduce((sum, s) => sum + s, 0) / defined.length;
  return Math.round((average / 20) * 100 * 100) / 100; // ramené sur 100
}
