// Bloc 5 — Production Vidéo (Débat Plateau Télé & Pitch de Synthèse).
// Contenu des consignes et grille de notation en PLACEHOLDER, en attendant
// le barème réel de la cliente (même pattern que les banques de questions
// lexique/oral — voir etaff-project-roadmap "Known gap"). Les 2 tâches sont
// obligatoires (pas de choix parmi une liste, contrairement au Bloc 3).
export interface VideoTask {
  index: number;
  title: string;
  context: string;
  mission: string;
  /** Durée maximale conseillée pour l'enregistrement, en secondes. */
  maxSeconds: number;
}

export const VIDEO_TASKS: VideoTask[] = [
  {
    index: 1,
    title: "Débat Plateau Télé",
    context:
      "Vous participez à un débat télévisé simulé sur l'externalisation des services (outsourcing) vers Madagascar. L'animateur vous interpelle : « Certains critiquent les centres d'appels délocalisés en affirmant qu'ils exploitent une main-d'œuvre bon marché sans réelle valeur ajoutée pour les talents locaux. Que leur répondez-vous ? »",
    mission:
      "Filmez votre intervention comme si vous étiez sur un plateau télé : défendez une position argumentée, avec aisance orale et une posture de communicant à l'aise face caméra.",
    maxSeconds: 180,
  },
  {
    index: 2,
    title: "Pitch de Synthèse",
    context:
      "Vous devez restituer, en une intervention synthétique, les points clés d'un dossier ou d'un projet que vous connaissez bien (professionnel, associatif ou académique).",
    mission:
      "Filmez un pitch de synthèse structuré (contexte, enjeux, conclusion ou recommandation) en 2 minutes maximum, comme si vous vous adressiez à un comité de décision.",
    maxSeconds: 120,
  },
];

// Grille de notation du Bloc 5 — même logique 4-échelons que le Bloc 3
// (src/evaluation/situations.ts), mais 5 critères notés 0.5/1/1.5/2 pour
// que chaque tâche culmine à 10 pts (5 critères × 2 pts) et le bloc entier
// à 20 pts (2 tâches × 10), cohérent avec le barème /20 par bloc.
export const VIDEO_GRADING_LEVELS = [
  { value: 0.5, label: "Insuffisant" },
  { value: 1, label: "Passable" },
  { value: 1.5, label: "Bon" },
  { value: 2, label: "Excellent" },
] as const;

export type VideoGradingLevelValue = (typeof VIDEO_GRADING_LEVELS)[number]["value"];

export interface VideoGradingCriterion {
  key: string;
  label: string;
  description: string;
  descriptors: Record<"0.5" | "1" | "1.5" | "2", string>;
}

export const VIDEO_GRADING_CRITERIA: VideoGradingCriterion[] = [
  {
    key: "presence",
    label: "Présence Caméra & Aisance",
    description: "Confort face caméra, regard, gestuelle, énergie",
    descriptors: {
      "0.5": "Mal à l'aise, regard fuyant, gestuelle absente ou parasite, lecture visible.",
      "1": "Présence correcte mais rigide ou hésitante par moments.",
      "1.5": "Bonne présence, naturel, regard caméra maîtrisé.",
      "2": "Présence remarquable, charisme et aisance de communicant professionnel.",
    },
  },
  {
    key: "structure",
    label: "Structure & Argumentation",
    description: "Construction du propos, enchaînement des idées, conclusion",
    descriptors: {
      "0.5": "Propos décousu, sans structure identifiable.",
      "1": "Idées présentes mais mal enchaînées ou incomplètes.",
      "1.5": "Structure claire, argumentation cohérente du début à la fin.",
      "2": "Structure percutante, argumentation solide et conclusion nette.",
    },
  },
  {
    key: "fluidite",
    label: "Clarté & Fluidité Orale",
    description: "Débit, articulation, gestion des hésitations",
    descriptors: {
      "0.5": "Débit très haché, nombreuses hésitations, difficile à suivre.",
      "1": "Débit irrégulier par moments mais message compréhensible.",
      "1.5": "Élocution claire, rythme naturel, peu d'hésitations.",
      "2": "Fluidité remarquable, débit maîtrisé et engageant.",
    },
  },
  {
    key: "vocabulaire",
    label: "Richesse du Vocabulaire Professionnel",
    description: "Registre, précision B2/C1, correction syntaxique",
    descriptors: {
      "0.5": "Vocabulaire pauvre ou inadapté, fautes fréquentes.",
      "1": "Vocabulaire basique mais correct, sans relief.",
      "1.5": "Bon niveau de langue, vocabulaire adapté, rares erreurs.",
      "2": "Vocabulaire riche, précis et idiomatique.",
    },
  },
  {
    key: "adequation",
    label: "Adéquation avec la Consigne",
    description: "Respect du format demandé (débat / pitch) et du temps imparti",
    descriptors: {
      "0.5": "Hors sujet ou format non respecté (durée, ton, exercice).",
      "1": "Consigne partiellement respectée.",
      "1.5": "Consigne bien respectée, format globalement adapté.",
      "2": "Consigne parfaitement respectée, format et temps maîtrisés.",
    },
  },
];
