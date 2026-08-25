// Bloc 5 — Production Vidéo (Débat Plateau Télé & Pitch de Synthèse).
// La tâche 2 (Pitch de Synthèse) reste en PLACEHOLDER, en attendant le
// barème réel de la cliente (même pattern que les banques de questions
// lexique/oral — voir etaff-project-roadmap "Known gap"). La tâche 1
// (Débat Plateau Télé) est le vrai contenu client : le candidat choisit
// d'abord un SUJET de débat (3 fournis le 2026-08-25 : influenceurs,
// inégalités salariales, santé publique — voir VideoTaskSubject), puis un
// rôle (Option A ou B) au sein de ce sujet — voir VideoTaskOption. Chaque
// sujet a sa propre contrainte linguistique (≥4 expressions parmi une liste
// propre au sujet, auto-déclaratif — le formateur en tient compte dans
// "Adéquation avec la Consigne") et sa propre vidéo de contexte, hébergée
// sur notre bucket (referenceVideoKey — les 3 sujets utilisent ce mode) ou
// intégrée en iframe depuis une source externe qui l'autorise explicitement
// (referenceVideoEmbedUrl — support gardé mais plus utilisé depuis que le
// sujet "inégalités salariales" est passé de l'iframe TV5Monde, peu fiable
// en test, à une vidéo fournie par le client).
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

export interface VideoTaskSubject {
  key: string;
  title: string;
  context: string;
  options: VideoTaskOption[];
  linguisticConstraint?: LinguisticConstraint;
  /**
   * Clé S3 (bucket StorageService) d'une vidéo de contexte hébergée par
   * nous — jamais exposée telle quelle à l'API publique, voir
   * EvaluationService.getVideoTasks qui la remplace par un booléen
   * `hasReferenceVideo`. Diffusée via
   * GET /evaluation/video-tasks/:index/subjects/:subjectKey/reference-video.
   */
  referenceVideoKey?: string;
  /** URL externe intégrable en iframe (contenu tiers autorisant l'embed, ex. TV5Monde) — exposée telle quelle, ce n'est pas un secret. */
  referenceVideoEmbedUrl?: string;
}

export interface VideoTask {
  index: number;
  title: string;
  context: string;
  /** Présent uniquement pour les tâches où le candidat choisit d'abord un sujet, puis un rôle. */
  subjects?: VideoTaskSubject[];
  /** Consigne à texte unique — utilisée seulement pour les tâches sans `subjects`. */
  mission?: string;
  /** Durée maximale conseillée pour l'enregistrement, en secondes. */
  maxSeconds: number;
}

export const VIDEO_TASKS: VideoTask[] = [
  {
    index: 1,
    title: "Débat Plateau Télé",
    context:
      "Vous participez à une émission télévisée. Choisissez un sujet de débat, puis un rôle au sein de ce sujet, et enregistrez une intervention vidéo de 3 minutes maximum.",
    subjects: [
      {
        key: "influenceurs",
        title: "Le marché des influenceurs et son encadrement",
        context:
          "Vous participez à une émission télévisée sur le marché des influenceurs et son encadrement.",
        options: [
          {
            key: "A",
            role: "Raphaël Molina (Avocat spécialisé)",
            objectif:
              "Plaider pour une régulation stricte du marché et la protection des mineurs.",
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
      },
      {
        key: "inegalites-salariales",
        title: "Les inégalités salariales et professionnelles",
        context:
          "Vous participez à une émission télévisée sur les inégalités salariales et professionnelles entre hommes et femmes.",
        options: [
          {
            key: "A",
            role: "L'Expert / L'Avocat en droit du travail",
            objectif:
              "Analyser les limites du cadre légal et plaider pour des sanctions ou des réformes contraignantes.",
            introduction:
              "Rappelez le constat chiffré des inégalités et le principe de gratuité du travail féminin en fin d'année.",
            developpement:
              "Expliquez pourquoi les lois actuelles sont insuffisantes et détaillez les dérives (plafond de verre, discrimination à l'embauche/promotion).",
            conclusion:
              "Proposez des mesures concrètes (audit obligatoire, pénalités financières) pour forcer les entreprises à réagir.",
          },
          {
            key: "B",
            role: "La Journaliste / Consultante en stratégie RH",
            objectif:
              "Proposer un plan d'action global pour les entreprises et changer les mentalités du monde du travail.",
            introduction: "Posez la problématique de la parité réelle versus la parité de façade.",
            developpement:
              "Présentez les leviers d'action internes (transparence des grilles salariales, réévaluation de la valeur des métiers féminisés, congé paternité).",
            conclusion:
              "Livrez une synthèse sur les bénéfices économiques et sociaux d'une égalité salariale effective.",
          },
        ],
        linguisticConstraint: {
          intro:
            "Pour valider votre niveau C1, vous devez intégrer au moins 4 expressions ou termes parmi la liste suivante dans votre discours :",
          termes: [
            "Plafond de verre / Écart de rémunération",
            "Transparence salariale / Cadre législatif",
            "Parité / Égalité professionnelle",
            "Pénalités financières / Métiers féminisés",
          ],
          minimum: 4,
        },
        // Remplace l'iframe TV5Monde initiale (2026-08-25) : accès instable
        // en test (Akamai "Access Denied" sur des requêtes automatisées, pas
        // confirmé fiable pour de vrais candidats) — le client a fourni sa
        // propre vidéo (reportage Terriennes/TV5Monde), remuxée en MP4 sans
        // réencodage (déjà H.264/AAC, 21 Mo) et hébergée sur notre bucket.
        referenceVideoKey: "evaluation-references/inegalites-salariales.mp4",
      },
      {
        key: "sante-publique",
        title: "Les politiques de santé publique",
        context:
          "Vous participez à un débat télévisé sur les politiques de santé publique.",
        options: [
          {
            key: "A",
            role: "Le Spécialiste de la santé publique / L'Expert international",
            objectif:
              "Dénoncer les fractures sanitaires et plaider pour une prise en charge globale et équitable de la santé.",
            introduction:
              "Définissez le concept d'accès universel aux soins et le constat d'inégalité actuel.",
            developpement:
              "Exposez les conséquences sociales et économiques du manque d'infrastructures ou de financement de la santé.",
            conclusion:
              "Proposez des mécanismes de financement solidaire et de coopération internationale.",
          },
          {
            key: "B",
            role: "Le Représentant d'une organisation humanitaire",
            objectif:
              "Alerter sur la situation des populations vulnérables et faire pression sur les décideurs politiques.",
            introduction: "Mettez en avant le droit fondamental à la santé.",
            developpement:
              "Présentez le travail de terrain, les urgences sanitaires et la réalité du manque de médicaments ou de personnel médical.",
            conclusion:
              "Lancez un appel à l'action pour une politique de santé qui dépasse les simples logiques lucratives.",
          },
        ],
        linguisticConstraint: {
          intro:
            "Pour valider votre niveau C1, vous devez intégrer au moins 4 expressions ou termes parmi la liste suivante dans votre discours :",
          termes: [
            "Couverture santé universelle / Système de santé",
            "Inégalités d'accès / Populations vulnérables",
            "Prévention / Protection sociale",
            "Politique publique de santé / Coopération internationale",
          ],
          minimum: 4,
        },
        // Reportage fourni par le client (interview Michel Sidibé, ONUSIDA),
        // déjà en MP4 H.264/AAC — juste remuxé pour le faststart, pas de
        // réencodage, puis hébergé sur notre bucket comme les 2 autres sujets.
        referenceVideoKey: "evaluation-references/sante-publique.mp4",
      },
    ],
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
