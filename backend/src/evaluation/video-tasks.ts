// Bloc 5 — Production Vidéo (Débat Plateau Télé & Pitch de Synthèse).
// La tâche 2 (Pitch de Synthèse) reste en PLACEHOLDER, en attendant le
// barème réel de la cliente (même pattern que les banques de questions
// lexique/oral — voir etaff-project-roadmap "Known gap"). La tâche 1
// (Débat Plateau Télé) est le vrai contenu client, fourni le 2026-08-25 :
// le candidat choisit un rôle (Option A ou B) avant d'enregistrer — voir
// VideoTaskOption ci-dessous — et doit intégrer au moins 4 des 5 expressions
// de la contrainte linguistique dans son intervention (auto-déclaratif, pas
// vérifié automatiquement : le formateur en tient compte dans "Adéquation
// avec la Consigne" à la correction).
export interface VideoTaskOption {
  key: string; // "A" | "B"
  role: string;
  objectif: string;
  introduction: string; // ~30s
  developpement: string; // ~1min30
  conclusion: string; // ~1min
}

export interface LinguisticConstraint {
  intro: string;
  termes: string[];
  minimum: number;
}

export interface VideoTask {
  index: number;
  title: string;
  context: string;
  /** Présent uniquement pour les tâches où le candidat choisit un rôle avant d'enregistrer. */
  options?: VideoTaskOption[];
  /** Consigne à texte unique — utilisée seulement pour les tâches sans `options`. */
  mission?: string;
  linguisticConstraint?: LinguisticConstraint;
  /**
   * Clé S3 (bucket StorageService, voir common/storage.service.ts) d'une
   * vidéo de contexte à visionner avant l'enregistrement (ex. reportage sur
   * le sujet du débat) — jamais exposée telle quelle à l'API publique, voir
   * EvaluationService.getVideoTasks qui la remplace par un simple booléen
   * `hasReferenceVideo`. Diffusée via GET /evaluation/video-tasks/:index/reference-video.
   */
  referenceVideoKey?: string;
  /** Durée maximale conseillée pour l'enregistrement, en secondes. */
  maxSeconds: number;
}

export const VIDEO_TASKS: VideoTask[] = [
  {
    index: 1,
    title: "Débat Plateau Télé",
    context:
      "Vous participez à une émission télévisée sur le marché des influenceurs et son encadrement. Choisissez un rôle et enregistrez une intervention vidéo de 3 minutes maximum.",
    options: [
      {
        key: "A",
        role: "Raphaël Molina (Avocat spécialisé)",
        objectif: "Plaider pour une régulation stricte du marché et la protection des mineurs.",
        introduction:
          "Présentez le flou juridique qui a longtemps régné autour du statut d'influenceur.",
        developpement:
          "Exposez les dérives (publicité clandestine, manque de transparence) et développez la question spécifique du droit du travail et de la protection des « enfants influenceurs ».",
        conclusion:
          "Proposez des solutions législatives et concluez sur la responsabilité des plateformes et des parents.",
      },
      {
        key: "B",
        role: "Camille Lanci (Journaliste à la RTS)",
        objectif: "Analyser le modèle économique du marketing d'influence et ses dérives.",
        introduction:
          "Dégagez l'ampleur du phénomène et la perte de vitesse des médias traditionnels face aux créateurs de contenu.",
        developpement:
          "Expliquez la stratégie des marques (recherche d'authenticité, proximité, ciblage) et la dépendance financière des créateurs.",
        conclusion:
          "Livrez une analyse critique sur l'avenir de ce marché et la sensibilisation nécessaire du public.",
      },
    ],
    linguisticConstraint: {
      intro:
        "Pour valider votre niveau C1, vous devez intégrer au moins 4 expressions ou termes parmi la liste suivante dans votre discours :",
      termes: [
        "Manque de transparence / Publicité clandestine",
        "Cadre législatif / Blâmer la régulation",
        "Monétisation / Modèle économique",
        "Droit à l'image / Protection des mineurs",
        "Capitaliser sur une communauté",
      ],
      minimum: 4,
    },
    referenceVideoKey: "evaluation-references/debat-plateau-tele.mp4",
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
