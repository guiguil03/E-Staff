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

// Grille officielle de notation ("grille_evaluation_c1_ecrit.pdf", fournie
// par la cliente le 2026-08-25 — remplace la grille conçue par analogie le
// même jour). 5 critères × 4 pts = 20 pts. Chaque critère a 4 paliers, dont
// 2 sont des PLAGES (pas une valeur unique) dans le document source :
// Insuffisant 0-1 pt, Moyen 1,5-2,5 pts, Bien 3 pts (fixe), Excellent 4 pts
// (fixe). Plutôt que d'écraser cette nuance sur une valeur unique par
// palier, chaque plage est exposée en 3 valeurs espacées de 0,5 (0/0.5/1 et
// 1.5/2/2.5) pour que le formateur choisisse la précision qu'il veut dans
// l'esprit du barème papier, sans en trahir les bornes. Seuil de validation
// indiqué sur le document : 14/20 (informatif ici — le palier global du
// candidat reste déterminé par le score /100 sur les 5 blocs, voir
// scoring.ts, pas par un seuil propre à ce bloc).
export const ESSAY_VALIDATION_THRESHOLD = 14;

export const ESSAY_GRADING_LEVELS = [
  { value: 0, label: "Insuffisant", band: "Insuffisant" },
  { value: 0.5, label: "Insuffisant", band: "Insuffisant" },
  { value: 1, label: "Insuffisant", band: "Insuffisant" },
  { value: 1.5, label: "Moyen", band: "Moyen" },
  { value: 2, label: "Moyen", band: "Moyen" },
  { value: 2.5, label: "Moyen", band: "Moyen" },
  { value: 3, label: "Bien", band: "Bien" },
  { value: 4, label: "Excellent", band: "Excellent" },
] as const;

export type EssayGradingLevelValue = (typeof ESSAY_GRADING_LEVELS)[number]["value"];

export interface EssayGradingCriterion {
  key: string;
  label: string;
  description: string;
  descriptors: Record<"0" | "0.5" | "1" | "1.5" | "2" | "2.5" | "3" | "4", string>;
}

export const ESSAY_GRADING_CRITERIA: EssayGradingCriterion[] = [
  {
    key: "structure",
    label: "1. Respect & Structure",
    description: "Respect du sujet/consigne, volume (400-500 mots), plan (intro/développement/conclusion)",
    descriptors: {
      "0": "Sujet non traité ou hors-sujet. Longueur insuffisante (<350 mots). Aucun plan distinct.",
      "0.5": "Sujet non traité ou hors-sujet. Longueur insuffisante (<350 mots). Aucun plan distinct.",
      "1": "Sujet non traité ou hors-sujet. Longueur insuffisante (<350 mots). Aucun plan distinct.",
      "1.5": "Traitement superficiel, plan confus ou déséquilibré. Respect approximatif du nombre de mots.",
      "2": "Traitement superficiel, plan confus ou déséquilibré. Respect approximatif du nombre de mots.",
      "2.5": "Traitement superficiel, plan confus ou déséquilibré. Respect approximatif du nombre de mots.",
      "3": "Bon respect de la consigne et de la longueur. Plan structuré et progression claire.",
      "4": "Traitement complet et parfaitement maîtrisé. Structure fluide et respect strict du volume.",
    },
  },
  {
    key: "argumentation",
    label: "2. Argumentation",
    description: "Maturité et nuance, prise en compte des 2 camps, exemples pertinents",
    descriptors: {
      "0": "Idées pauvres, répétitives ou non justifiées. Aucun exemple concret.",
      "0.5": "Idées pauvres, répétitives ou non justifiées. Aucun exemple concret.",
      "1": "Idées pauvres, répétitives ou non justifiées. Aucun exemple concret.",
      "1.5": "Arguments simplistes ou unilatéraux. Exemples vagues ou peu adaptés.",
      "2": "Arguments simplistes ou unilatéraux. Exemples vagues ou peu adaptés.",
      "2.5": "Arguments simplistes ou unilatéraux. Exemples vagues ou peu adaptés.",
      "3": "Arguments solides et nuancés. Bonnes illustrations avec des exemples concrets.",
      "4": "Argumentation fine, hautement critique et nuancée. Exemples riches et très bien intégrés.",
    },
  },
  {
    key: "vocabulaire",
    label: "3. Vocabulaire",
    description: "Richesse et précision, registre soutenu/C1, variété lexicale",
    descriptors: {
      "0": "Vocabulaire très limité, pauvre ou inadapté (registre familier).",
      "0.5": "Vocabulaire très limité, pauvre ou inadapté (registre familier).",
      "1": "Vocabulaire très limité, pauvre ou inadapté (registre familier).",
      "1.5": "Vocabulaire juste suffisant, répétitions fréquentes, manque de précision.",
      "2": "Vocabulaire juste suffisant, répétitions fréquentes, manque de précision.",
      "2.5": "Vocabulaire juste suffisant, répétitions fréquentes, manque de précision.",
      "3": "Vocabulaire riche, varié et formel, adapté à un essai argumentatif C1.",
      "4": "Lexique élevé, étendu et d'une précision remarquable. Style châtié et élégant.",
    },
  },
  {
    key: "grammaire",
    label: "4. Grammaire",
    description: "Complexité syntaxique, correction grammaticale, orthographe",
    descriptors: {
      "0": "Erreurs grammaticales fréquentes et lourdes gênant la compréhension.",
      "0.5": "Erreurs grammaticales fréquentes et lourdes gênant la compréhension.",
      "1": "Erreurs grammaticales fréquentes et lourdes gênant la compréhension.",
      "1.5": "Syntaxe basique, fautes d'accord ou de grammaire récurrentes.",
      "2": "Syntaxe basique, fautes d'accord ou de grammaire récurrentes.",
      "2.5": "Syntaxe basique, fautes d'accord ou de grammaire récurrentes.",
      "3": "Bonne maîtrise syntaxique (phrases complexes, subjonctif). Rares coquilles.",
      "4": "Maîtrise parfaite des structures complexes. Orthographe et syntaxe irréprochables.",
    },
  },
  {
    key: "coherence",
    label: "5. Cohérence",
    description: "Fluidité de la lecture, connecteurs logiques, transitions",
    descriptors: {
      "0": "Absence de liens logiques, idées décousues et transitions inexistantes.",
      "0.5": "Absence de liens logiques, idées décousues et transitions inexistantes.",
      "1": "Absence de liens logiques, idées décousues et transitions inexistantes.",
      "1.5": "Utilisation répétitive ou maladroite des articulations logiques.",
      "2": "Utilisation répétitive ou maladroite des articulations logiques.",
      "2.5": "Utilisation répétitive ou maladroite des articulations logiques.",
      "3": "Bonne utilisation des connecteurs logiques pour articuler la pensée.",
      "4": "Fluidité exemplaire, transitions subtiles et enchaînement naturel des paragraphes.",
    },
  },
];
