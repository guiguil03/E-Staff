// Données d'exemple pour le Compte Apprenant — module 3 (Formation &
// Pédagogie) de la roadmap n'existe pas encore côté backend (pas de vraie
// table séances/assiduité/commentaires). Ce fichier fait la même chose que
// EXAMPLE_POSTS / EXAMPLE_TESTIMONIALS sur /communaute : du contenu
// plausible pour valider le design avec la cliente, à remplacer par de
// vraies données une fois le module construit.

export interface CompetencyScore {
  key: string;
  label: string;
  score: number; // /20
}

export const DIAGNOSTIC_INITIAL: { global: number; competencies: CompetencyScore[] } = {
  global: 67,
  competencies: [
    { key: "comprehension_orale", label: "Compréhension orale", score: 15 },
    { key: "expression_orale", label: "Expression orale", score: 12 },
    { key: "comprehension_ecrite", label: "Compréhension écrite", score: 16 },
    { key: "expression_ecrite", label: "Expression écrite", score: 11 },
    { key: "posture_eloquence", label: "Posture & Éloquence", score: 13 },
  ],
};

export const SEANCE_ACTUELLE: { global: number; competencies: CompetencyScore[] } = {
  global: 74,
  competencies: [
    { key: "comprehension_orale", label: "Compréhension orale", score: 17 },
    { key: "expression_orale", label: "Expression orale", score: 14 },
    { key: "comprehension_ecrite", label: "Compréhension écrite", score: 16 },
    { key: "expression_ecrite", label: "Expression écrite", score: 12 },
    { key: "posture_eloquence", label: "Posture & Éloquence", score: 15 },
  ],
};

export const TAUX_REUSSITE_GLOBAL = 82;

export const WEEKLY_AVERAGES = [
  { week: 0, label: "Initial", moyenne: 67 },
  { week: 1, label: "S1", moyenne: 69 },
  { week: 2, label: "S2", moyenne: 71 },
  { week: 3, label: "S3", moyenne: 74 },
];

export const CECR_GAUGE = { value: 62 }; // % — palier calculé dans CecrGauge.tsx

export const ASSIDUITE = [
  { semaine: 1, tauxAbsence: 0, retards: 0, statut: "ok" as const },
  { semaine: 2, tauxAbsence: 0, retards: 1, statut: "ok" as const },
  { semaine: 3, tauxAbsence: 10, retards: 0, statut: "attention" as const },
  { semaine: 4, tauxAbsence: 0, retards: 0, statut: "ok" as const },
];

export const ALERTE_PEDAGOGIQUE = {
  competence: "Expression Écrite",
};

export const COMMENTAIRE_FORMATEUR = {
  text: "Excellente progression globale sur ce mois. Concentrez-vous sur la fluidité de votre expression écrite pour le prochain module — vous avez le niveau, il ne manque que la régularité.",
  author: "Hasina R., Formatrice FOL",
};

export const PROCHAINE_SEANCE = {
  title: "Atelier Expression Écrite Intensive",
  // Calculée dynamiquement au chargement (voir CountdownTimer) plutôt que
  // figée, pour que la démo affiche toujours un compte à rebours vivant.
  hoursFromNow: 26,
};
