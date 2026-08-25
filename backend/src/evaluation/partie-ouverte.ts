// Bloc 1 — "Partie 2 : Questions Ouvertes et Rédaction" (10 pts sur les 20
// du bloc — voir LEXIQUE_QUESTIONS dans questions.ts pour la "Partie 1",
// QCM auto-corrigé, 10 pts). Contenu réel fourni par la cliente le
// 2026-08-25. Contrairement au QCM, ces réponses sont du texte libre notées
// par le formateur (même principe que le Bloc 2 — voir
// commentaire-argumentatif.ts) : le corrigé ci-dessous n'est qu'une aide à
// la correction, pas une comparaison automatique (une reformulation ou un
// synonyme valides peuvent différer du texte exact du corrigé).
export interface PartieOuverteContent {
  reformulation: { consigne: string; phrase: string; starter: string; corrige: string };
  pluriels: { mot: string; corrige: string }[];
  stylistique: { phrase: string; question: string; corrige: string };
  synonyme: { phrase: string; mot: string; corrige: string };
  redaction: { sujet: string; consignes: string[]; minWords: number; maxWords: number };
}

export const PARTIE_OUVERTE_CONTENT: PartieOuverteContent = {
  reformulation: {
    consigne:
      "Changement de mode : transformez la phrase suivante en la commençant par « Il est peu probable que... » (faites la modification nécessaire).",
    phrase: "Cette mesure résoudra la crise en quelques semaines.",
    starter: "Il est peu probable que",
    corrige: "Il est peu probable que cette mesure résolve la crise en quelques semaines.",
  },
  pluriels: [
    { mot: "Un coffre-fort", corrige: "des coffres-forts" },
    { mot: "Un compte-rendu", corrige: "des comptes-rendus" },
    { mot: "Un savoir-faire", corrige: "des savoir-faire (invariable)" },
  ],
  stylistique: {
    phrase: "« La plume est plus forte que l'épée. »",
    question:
      "Quelle figure de style est utilisée quand « la plume » désigne les écrits/la presse et « l'épée » désigne la force armée ?",
    corrige: "Métonymie",
  },
  synonyme: {
    phrase: "« C'est une avancée importante. »",
    mot: "importante",
    corrige: "Significative / Majeure / Notable / Considérable",
  },
  redaction: {
    sujet: "Selon vous, le télétravail nuit-il à la cohésion d'équipe et à la culture d'entreprise ?",
    consignes: [
      "Rédigez un paragraphe structuré de 150 à 200 mots.",
      "Adoptez un registre soutenu et professionnel.",
      "Intégrez au moins 2 connecteurs logiques formels (ex : en premier lieu, en revanche, toutefois, par conséquent, nonobstant).",
    ],
    minWords: 150,
    maxWords: 200,
  },
};

// Barème officiel (10 pts) : chaque critère se note de 0 à son maxPoints,
// par pas de 0,5 — comme les exercices 1/2 sont des réponses précises
// (reformulation, pluriels, figure de style, synonyme) plutôt que des
// niveaux qualitatifs, un barème "points obtenus" colle mieux à l'esprit du
// corrigé qu'une grille à 4 échelons fixes (réservée à la rédaction).
export interface PartieOuverteGradingCriterion {
  key: string;
  label: string;
  description: string;
  maxPoints: number;
}

export const PARTIE_OUVERTE_GRADING_CRITERIA: PartieOuverteGradingCriterion[] = [
  {
    key: "reformulation",
    label: "Exercice 1 — Changement de mode (reformulation)",
    description: "Subjonctif correctement employé après « il est peu probable que »",
    maxPoints: 1.5,
  },
  {
    key: "pluriels",
    label: "Exercice 1 — Orthographe & Pluriel (3 mots composés)",
    description: "0,5 pt par mot correctement mis au pluriel",
    maxPoints: 1.5,
  },
  {
    key: "stylistique",
    label: "Exercice 2 — Figure de style",
    description: "Identification de la métonymie",
    maxPoints: 1,
  },
  {
    key: "synonyme",
    label: "Exercice 2 — Synonyme soutenu",
    description: "Synonyme de « importante » dans un registre soutenu",
    maxPoints: 1,
  },
  {
    key: "redaction_volume",
    label: "Exercice 3 — Respect du volume et de la consigne",
    description: "150 à 200 mots, sujet traité",
    maxPoints: 1,
  },
  {
    key: "redaction_langue",
    label: "Exercice 3 — Qualité de la langue et registre C1",
    description: "Registre soutenu et professionnel, correction grammaticale",
    maxPoints: 1.5,
  },
  {
    key: "redaction_structure",
    label: "Exercice 3 — Clarté de l'argumentation et structure",
    description: "Paragraphe structuré, idées claires",
    maxPoints: 1.5,
  },
  {
    key: "redaction_connecteurs",
    label: "Exercice 3 — Emploi correct des 2 connecteurs logiques",
    description: "Au moins 2 connecteurs formels employés à bon escient",
    maxPoints: 1,
  },
];
