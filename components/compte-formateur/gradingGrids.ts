// Barèmes de notation par compétence pour "Planning par Groupe & Moyenne de
// Séance". Remplace la saisie libre /20 par les vraies grilles de critères
// fournies par la cliente : Production/Expression Orale et Écrite (grilles
// DELF B2/B2+, notées /25 puis ramenées à /20), Posture & Éloquence (grille
// maison, 12 sous-critères, déjà proche de /20, juste plafonnée). Distinct
// du barème du Bloc 3 mises-en-situation (backend/src/evaluation/situations.ts)
// — même esprit (échelons stricts, pas de note libre) mais grilles propres
// à ce module. Compréhension orale/écrite restent hors grille : dépôt de
// document + note directe (cf. UploadCompetencyForm) — ça relève dans
// l'esprit de l'écran "Évaluer & Corriger", mais la note alimente quand
// même la moyenne de séance ici.

export type CompetencyKey =
  | "comprehension_orale"
  | "expression_orale"
  | "comprehension_ecrite"
  | "expression_ecrite"
  | "posture_eloquence";

export interface CompetencyDef {
  key: CompetencyKey;
  label: string;
  mode: "grid" | "upload";
}

export const COMPETENCY_DEFS: CompetencyDef[] = [
  { key: "comprehension_orale", label: "Compréhension orale", mode: "upload" },
  { key: "expression_orale", label: "Expression orale", mode: "grid" },
  { key: "comprehension_ecrite", label: "Compréhension écrite", mode: "upload" },
  { key: "expression_ecrite", label: "Expression écrite", mode: "grid" },
  { key: "posture_eloquence", label: "Posture & Éloquence", mode: "grid" },
];

// ---- Grilles DELF (Expression Orale / Expression Écrite) ----

export interface DelfLevel {
  key: string;
  value: number;
  label: string;
}

export const DELF_LEVELS: DelfLevel[] = [
  { key: "insuffisant", value: 0, label: "Non répondu / insuffisant" },
  { key: "en_dessous", value: 1, label: "En dessous du niveau ciblé" },
  { key: "b2", value: 3, label: "B2" },
  { key: "b2plus", value: 5, label: "B2+" },
];

export interface DelfCriterion {
  key: string;
  group: string;
  label: string;
}

export const EXPRESSION_ORALE_CRITERIA: DelfCriterion[] = [
  {
    key: "monologue",
    group: "Compétences pragmatique et sociolinguistique",
    label: "Réalisation de la tâche : monologue suivi (5 à 7 min)",
  },
  {
    key: "interaction",
    group: "Compétences pragmatique et sociolinguistique",
    label: "Réalisation de la tâche : exercice en interaction (10 à 13 min)",
  },
  { key: "lexique", group: "Compétence linguistique", label: "Lexique" },
  { key: "morphosyntaxe", group: "Compétence linguistique", label: "Morphosyntaxe" },
  {
    key: "phonologie",
    group: "Compétence linguistique",
    label: "Maîtrise du système phonologique",
  },
];
export const EXPRESSION_ORALE_MAX = EXPRESSION_ORALE_CRITERIA.length * 5; // 25

export const EXPRESSION_ECRITE_CRITERIA: DelfCriterion[] = [
  { key: "realisation_tache", group: "Compétence pragmatique", label: "Réalisation de la tâche" },
  { key: "coherence_cohesion", group: "Compétence pragmatique", label: "Cohérence et cohésion" },
  {
    key: "adequation_sociolinguistique",
    group: "Compétence sociolinguistique",
    label: "Adéquation sociolinguistique",
  },
  { key: "lexique", group: "Compétence linguistique", label: "Lexique" },
  { key: "morphosyntaxe", group: "Compétence linguistique", label: "Morphosyntaxe" },
];
export const EXPRESSION_ECRITE_MAX = EXPRESSION_ECRITE_CRITERIA.length * 5; // 25

export function computeDelfScoreOn20(
  selections: Record<string, number | undefined>,
  criteria: DelfCriterion[],
  maxRaw: number
): number | null {
  if (!criteria.every((c) => selections[c.key] !== undefined)) return null;
  const total = criteria.reduce((sum, c) => sum + (selections[c.key] ?? 0), 0);
  return Math.round((total / maxRaw) * 20 * 100) / 100;
}

// ---- Anomalies (Expression Écrite uniquement) ----

export interface AnomalyDef {
  key: string;
  label: string;
}

export const EXPRESSION_ECRITE_ANOMALIES: AnomalyDef[] = [
  {
    key: "hors_sujet_thematique",
    label:
      "Hors-sujet thématique : le candidat ne peut pas être identifié « B2+ » pour « réalisation de la tâche » et « lexique ».",
  },
  {
    key: "hors_sujet_discursif",
    label:
      "Hors-sujet discursif : le candidat ne peut être identifié ni « B2 » ni « B2+ » pour « réalisation de la tâche » et « cohérence et cohésion ».",
  },
  {
    key: "hors_sujet_complet",
    label:
      "Hors-sujet complet (thématique et discursif) : 0 aux critères « réalisation de la tâche », « cohérence et cohésion » et « adéquation sociolinguistique ». Ni « B2 » ni « B2+ » pour « lexique » et « morphosyntaxe ».",
  },
  { key: "copie_blanche", label: "Copie blanche : 0 à l'ensemble des critères de cet exercice." },
  {
    key: "manque_matiere",
    label:
      "Manque de matière évaluable : le candidat produit moins de 50 % des mots attendus (124 mots ou moins) → 0 à l'ensemble des critères.",
  },
];

interface AnomalyRule {
  forced?: number;
  capAt?: number;
}

const ANOMALY_RULES: Record<string, Record<string, AnomalyRule>> = {
  hors_sujet_thematique: {
    realisation_tache: { capAt: 3 },
    lexique: { capAt: 3 },
  },
  hors_sujet_discursif: {
    realisation_tache: { capAt: 1 },
    coherence_cohesion: { capAt: 1 },
  },
  hors_sujet_complet: {
    realisation_tache: { forced: 0 },
    coherence_cohesion: { forced: 0 },
    adequation_sociolinguistique: { forced: 0 },
    lexique: { capAt: 3 },
    morphosyntaxe: { capAt: 3 },
  },
  copie_blanche: {
    realisation_tache: { forced: 0 },
    coherence_cohesion: { forced: 0 },
    adequation_sociolinguistique: { forced: 0 },
    lexique: { forced: 0 },
    morphosyntaxe: { forced: 0 },
  },
  manque_matiere: {
    realisation_tache: { forced: 0 },
    coherence_cohesion: { forced: 0 },
    adequation_sociolinguistique: { forced: 0 },
    lexique: { forced: 0 },
    morphosyntaxe: { forced: 0 },
  },
};

export function anomalyRuleFor(
  anomalyKey: string | undefined,
  criterionKey: string
): AnomalyRule | undefined {
  if (!anomalyKey) return undefined;
  return ANOMALY_RULES[anomalyKey]?.[criterionKey];
}

// Applique la règle d'anomalie aux sélections courantes : force les
// critères concernés à 0, ou ramène au plafond les valeurs qui le
// dépassent (ex: un critère déjà coché "B2+" quand on coche ensuite
// "Hors-sujet thématique" retombe à "B2").
export function applyAnomaly(
  selections: Record<string, number | undefined>,
  anomalyKey: string | undefined
): Record<string, number | undefined> {
  if (!anomalyKey) return selections;
  const rules = ANOMALY_RULES[anomalyKey] ?? {};
  const next = { ...selections };
  for (const [criterionKey, rule] of Object.entries(rules)) {
    if (rule.forced !== undefined) {
      next[criterionKey] = rule.forced;
    } else if (rule.capAt !== undefined) {
      const current = next[criterionKey];
      if (current !== undefined && current > rule.capAt) {
        next[criterionKey] = rule.capAt;
      }
    }
  }
  return next;
}

// ---- Grille Posture & Éloquence ----

export interface PostureLevel {
  key: string;
  value: number;
  label: string;
}

export const POSTURE_LEVELS: PostureLevel[] = [
  { key: "insuffisant", value: 0.5, label: "Insuffisant" },
  { key: "passable", value: 1, label: "Passable" },
  { key: "bien", value: 1.75, label: "Bien" },
];

export interface PostureCriterion {
  key: string;
  section: string;
  group: string;
  label: string;
}

export const POSTURE_CRITERIA: PostureCriterion[] = [
  {
    key: "intro",
    section: "Éloquence & Discours",
    group: "Structure & Clarté",
    label: "Introduction logique & accroche",
  },
  {
    key: "coherence",
    section: "Éloquence & Discours",
    group: "Structure & Clarté",
    label: "Cohérence & déroulé du propos",
  },
  {
    key: "conclusion",
    section: "Éloquence & Discours",
    group: "Structure & Clarté",
    label: "Conclusion claire & impactante",
  },
  {
    key: "precision_termes",
    section: "Éloquence & Discours",
    group: "Vocabulaire & Conviction",
    label: "Précision des termes & registre",
  },
  {
    key: "persuasion",
    section: "Éloquence & Discours",
    group: "Vocabulaire & Conviction",
    label: "Force de persuasion & argumentation",
  },
  {
    key: "objections",
    section: "Éloquence & Discours",
    group: "Vocabulaire & Conviction",
    label: "Gestion des objections / Questions",
  },
  {
    key: "volume",
    section: "Posture & Présence Scénique",
    group: "Vocalise & Diction",
    label: "Volume & Articulation",
  },
  {
    key: "debit",
    section: "Posture & Présence Scénique",
    group: "Vocalise & Diction",
    label: "Débit de parole & Silences",
  },
  {
    key: "ancrage",
    section: "Posture & Présence Scénique",
    group: "Langage corporel",
    label: "Ancrage au sol & Posture",
  },
  {
    key: "gestuelle",
    section: "Posture & Présence Scénique",
    group: "Langage corporel",
    label: "Gestuelle d'appui & Tics évités",
  },
  {
    key: "regard",
    section: "Posture & Présence Scénique",
    group: "Présence & Auditoire",
    label: "Regard & Balayage de la salle",
  },
  {
    key: "accroche_visuelle",
    section: "Posture & Présence Scénique",
    group: "Présence & Auditoire",
    label: "Accroche visuelle & Charisme global",
  },
];
export const POSTURE_MAX_RAW = POSTURE_CRITERIA.length * 1.75; // 21

export interface PostureAdjustments {
  malusTemps: boolean;
  malusSupport: boolean;
  bonus: 0 | 0.5 | 1;
}

export const POSTURE_DEFAULT_ADJUSTMENTS: PostureAdjustments = {
  malusTemps: false,
  malusSupport: false,
  bonus: 0,
};

// Pas de mise à l'échelle proportionnelle ici : la grille est conçue pour
// tomber près de /20 (12 × 1,75 = 21) — on additionne juste les ajustements
// et on plafonne, comme le document "NOTE FINALE (plafonné à 20)".
export function computePostureScoreOn20(
  selections: Record<string, number | undefined>,
  adjustments: PostureAdjustments
): number | null {
  if (!POSTURE_CRITERIA.every((c) => selections[c.key] !== undefined)) return null;
  const subtotal = POSTURE_CRITERIA.reduce((sum, c) => sum + (selections[c.key] ?? 0), 0);
  const malus = (adjustments.malusTemps ? -1 : 0) + (adjustments.malusSupport ? -1 : 0);
  const raw = subtotal + adjustments.bonus + malus;
  return Math.min(20, Math.max(0, Math.round(raw * 100) / 100));
}

// ---- Taux d'assimilation ----

export function tauxAssimilation(scoreOn20: number | null): number | null {
  if (scoreOn20 === null) return null;
  return Math.round((scoreOn20 / 20) * 100);
}
