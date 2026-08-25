// Bloc 2 — Commentaire Argumentatif (contenu client fourni le 2026-08-25).
// Le candidat choisit UN sujet parmi 3 et rédige un essai argumenté de 400 à
// 500 mots en réaction au texte déclencheur. Contrairement aux Blocs 3/5
// (audio/vidéo), la réponse est un texte saisi directement, pas un fichier.
export interface EssaySubject {
  key: string;
  domain: string;
  title: string;
  texte: string;
  consigne: string;
  minWords: number;
  maxWords: number;
}

export const ESSAY_SUBJECTS: EssaySubject[] = [
  {
    key: "arctique",
    domain: "Géopolitique & Économie",
    title: "L'Arctique, nouveau théâtre des rivalités mondiales",
    texte:
      "« Alors que la fonte des glaces s'accélère sous l'effet du réchauffement climatique, la région arctique devient un point névralgique de la géopolitique mondiale. L'ouverture de nouvelles routes maritimes plus courtes et l'accès à des gisements inexploités de pétrole, de gaz et de métaux rares aiguisent les appétits des grandes puissances, notamment des États-Unis, de la Chine et des pays de l'Union européenne. Les appels à ériger l'Arctique en sanctuaires environnementaux se heurtent directement aux impératifs de souveraineté et de rentabilité économique. L'Arctique incarne ainsi le dilemme moderne : faut-il céder à la course aux ressources ou imposer une gouvernance multilatérale stricte pour préserver un équilibre environnemental mondial déjà fragilisé ? »",
    consigne:
      "Rédigez un essai argumenté (400 à 500 mots). Pensez-vous que la préservation des zones stratégiques mondiales doit primer sur les souverainetés nationales et les intérêts économiques des États ? Vous illustrerez votre propos à l'aide d'exemples précis et vous exprimerez votre avis de manière structurée et nuancée.",
    minWords: 400,
    maxWords: 500,
  },
  {
    key: "adaptation-climatique",
    domain: "Environnement & Société",
    title: "L'adaptation face à la récurrence des étés extrêmes",
    texte:
      "« Les vagues de chaleur successives et les événements météorologiques extrêmes observés ces dernières années ne sont plus des anomalies d'un été exceptionnel, mais la norme. Face à ce constat, les appels à \"l'adaptation\" se multiplient : végétalisation des villes, ajustement des horaires de travail, généralisation de la climatisation, annulation d'événements publics estivaux. Pourtant, des voix s'élèvent pour dénoncer une dérive : en se focalisant uniquement sur la gestion des conséquences à court terme, la société risquerait d'abandonner l'effort collectif d'atténuation du changement climatique. S'adapter aux conditions extrêmes est-il un aveu d'échec face à la crise climatique ou la seule réaction pragmatique possible ? »",
    consigne:
      "Rédigez un essai argumenté (400 à 500 mots). L'adaptation au changement climatique constitue-t-elle selon vous une résignation face à l'urgence environnementale ou une étape indispensable pour la survie de nos sociétés ? Développez votre réflexion en pesant les arguments des deux camps avant de donner votre position personnelle.",
    minWords: 400,
    maxWords: 500,
  },
  {
    key: "ia-creation",
    domain: "Culture & Technologie",
    title: "L'Intelligence Artificielle dans la création artistique : outil ou menace ?",
    texte:
      "« La multiplication des œuvres générées ou assistées par intelligence artificielle suscite un débat houleux dans le milieu culturel. D'un côté, des institutions de renom et des artistes contemporains intègrent l'IA comme un médium inédit, permettant de réinventer le patrimoine ou de pousser plus loin l'exploration créative. De l'autre, de nombreux créateurs dénoncent le pillage des œuvres pour entraîner des algorithmes et redoutent une uniformisation de la culture, voire la dévalorisation du travail humain. Alors que la frontière entre invention humaine et génération algorithmique s'estompe, la culture risque-t-elle de perdre son âme au profit de la machine ? »",
    consigne:
      "Rédigez un essai argumenté (400 à 500 mots). L'intégration des technologies de pointe dans le domaine artistique menace-t-elle la valeur de la création humaine, ou en constitue-t-elle un simple prolongement naturel ? Vous étaierez votre prise de position en vous appuyant sur des arguments clairs et des exemples tirés de la culture contemporaine.",
    minWords: 400,
    maxWords: 500,
  },
];

// Grille de notation — pas d'axes fournis par la cliente pour ce bloc (voir
// brief du 2026-08-25 : texte déclencheur + consigne uniquement). Conçue par
// analogie avec les grilles Bloc 3/5 déjà fournies par la cliente (4
// critères, 4 échelons stricts) : 4 critères × 5 pts = 20 pts, seuils à
// 25/50/75/100 % du critère (1.25 / 2.5 / 3.75 / 5). À ajuster si la
// cliente fournit sa propre grille plus tard.
export const ESSAY_GRADING_LEVELS = [
  { value: 1.25, label: "Insuffisant" },
  { value: 2.5, label: "Passable" },
  { value: 3.75, label: "Bon" },
  { value: 5, label: "Excellent" },
] as const;

export type EssayGradingLevelValue = (typeof ESSAY_GRADING_LEVELS)[number]["value"];

export interface EssayGradingCriterion {
  key: string;
  label: string;
  description: string;
  descriptors: Record<"1.25" | "2.5" | "3.75" | "5", string>;
}

export const ESSAY_GRADING_CRITERIA: EssayGradingCriterion[] = [
  {
    key: "comprehension_position",
    label: "Compréhension du sujet & Prise de position",
    description: "Cerne les enjeux du texte, prend une position claire et y répond réellement",
    descriptors: {
      "1.25": "Hors-sujet ou position absente/contradictoire, texte déclencheur mal compris.",
      "2.5": "Sujet globalement compris mais position floue ou partiellement traitée.",
      "3.75": "Sujet bien compris, position claire et maintenue tout au long de l'essai.",
      "5": "Compréhension fine des enjeux, position claire, nuancée et justifiée de bout en bout.",
    },
  },
  {
    key: "argumentation",
    label: "Qualité de l'argumentation & Exemples",
    description: "Solidité des arguments, pertinence et précision des exemples utilisés",
    descriptors: {
      "1.25": "Arguments faibles ou absents, pas d'exemples ou exemples hors-sujet.",
      "2.5": "Arguments présents mais peu développés, exemples vagues ou génériques.",
      "3.75": "Arguments solides, exemples précis et pertinents à l'appui du propos.",
      "5": "Argumentation riche et convaincante, exemples précis, variés et bien exploités.",
    },
  },
  {
    key: "structure",
    label: "Structure & Cohérence du raisonnement",
    description: "Organisation de l'essai, enchaînement logique des idées, transitions",
    descriptors: {
      "1.25": "Essai décousu, sans plan identifiable, idées juxtaposées sans lien.",
      "2.5": "Structure présente mais déséquilibrée ou transitions maladroites.",
      "3.75": "Plan clair (introduction, développement, conclusion), enchaînement logique.",
      "5": "Structure percutante et fluide, progression du raisonnement irréprochable.",
    },
  },
  {
    key: "langue",
    label: "Richesse & Correction de la langue",
    description: "Registre écrit, précision lexicale B2/C1, correction grammaticale et syntaxique",
    descriptors: {
      "1.25": "Vocabulaire pauvre ou inadapté, fautes fréquentes qui gênent la compréhension.",
      "2.5": "Vocabulaire basique mais correct, quelques fautes récurrentes.",
      "3.75": "Bon niveau de langue (B2/C1), vocabulaire varié, rares erreurs.",
      "5": "Langue riche, précise et idiomatique, quasi sans erreur.",
    },
  },
];
