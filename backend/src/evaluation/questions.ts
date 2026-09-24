// Banques de questions auto-corrigées (lexique + compréhension orale).
//
// LEXIQUE_QUESTIONS = "Partie 1" du Bloc 1 (QCM linguistique et
// stylistique, 10 pts sur les 20 du bloc — voir PARTIE_OUVERTE_CONTENT dans
// partie-ouverte.ts pour la "Partie 2", 10 pts notés par le formateur).
// Contenu réel fourni par la cliente, 2e version le 2026-08-25 (remplace un
// premier jeu de 10 questions envoyé plus tôt le même jour, jugé pas encore
// au niveau souhaité). ORAL_QUESTIONS (Bloc 4) : contenu réel fourni le
// 2026-09-24, sur la vidéo ORAL_MEDIA.
export interface QcmQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctChoice: string;
}

export const LEXIQUE_QUESTIONS: QcmQuestion[] = [
  {
    id: "lex-1",
    prompt:
      "Grammaire & Modes — « Bien que le projet ______ quelques réticences, la direction a décidé de le valider. »",
    choices: ["a suscité", "suscite", "suscitera", "aura suscité"],
    correctChoice: "suscite",
  },
  {
    id: "lex-2",
    prompt: "Précision lexicale — Quel terme désigne une difficulté ou un obstacle majeur sur lequel on bute ?",
    choices: ["Une aporie", "Un écueil", "Un différend", "Une digression"],
    correctChoice: "Un écueil",
  },
  {
    id: "lex-3",
    prompt: "Registre soutenu & Prépositions — Choisissez la formulation correcte à l'écrit :",
    choices: [
      "Il faut pallier à ce problème rapidement.",
      "Il faut pallier ce problème rapidement.",
      "Il faut pallier de ce problème rapidement.",
      "Il faut pallier sur ce problème rapidement.",
    ],
    correctChoice: "Il faut pallier ce problème rapidement.",
  },
  {
    id: "lex-4",
    prompt:
      "Figures de style — « Cette décision n'est pas sans intérêt. » (pour dire qu'elle est très intéressante)",
    choices: ["Une prétérition", "Une litote", "Un euphémisme", "Une métaphore"],
    correctChoice: "Une litote",
  },
  {
    id: "lex-5",
    prompt: "Accord du participe passé — Laquelle de ces phrases est parfaitement orthographiée ?",
    choices: [
      "Les analyses que nous avons fait ont été utiles.",
      "Les analyses que nous avons faites ont été utiles.",
      "Les analyses que nous avons faite ont été utiles.",
      "Les analyses que nous avons faits ont été utiles.",
    ],
    correctChoice: "Les analyses que nous avons faites ont été utiles.",
  },
  {
    id: "lex-6",
    prompt: "Orthographe des adjectifs composés de couleur — Choisissez la bonne graphie :",
    choices: [
      "Des chemises bleu-marines",
      "Des chemises bleues marines",
      "Des chemises bleu marine",
      "Des chemises bleues marine",
    ],
    correctChoice: "Des chemises bleu marine",
  },
  {
    id: "lex-7",
    prompt: "Nuances du vocabulaire — Que signifie l'adjectif « péremptoire » ?",
    choices: [
      "Qui dure très peu de temps.",
      "Contre lequel on ne peut rien répliquer, qui tranche de manière définitive.",
      "Qui manque de clarté et de précision.",
      "Qui est dépassé ou démodé.",
    ],
    correctChoice: "Contre lequel on ne peut rien répliquer, qui tranche de manière définitive.",
  },
  {
    id: "lex-8",
    prompt:
      "Connecteurs logiques — Quel connecteur permet d'introduire une concession (équivalent de « malgré cela ») ?",
    choices: ["En effet", "Néanmoins", "Corollairement", "Subséquemment"],
    correctChoice: "Néanmoins",
  },
  {
    id: "lex-9",
    prompt:
      "Subjonctif vs Indicatif — « Je ne pense pas que ce candidat ______ en mesure de gérer cette équipe. »",
    choices: ["est", "soit", "sera", "fut"],
    correctChoice: "soit",
  },
  {
    id: "lex-10",
    prompt: "Orthographe des noms composés — Quel est le pluriel correct du mot « un garde-fou » ?",
    choices: ["des gardes-fous", "des garde-fous", "des gardes-fou", "des garde-fou"],
    correctChoice: "des gardes-fous",
  },
];

// Support du Bloc 4 : vidéo (reel Facebook) fournie par la cliente le
// 2026-09-24, visionnée par le candidat AVANT les questions. Contenu tiers
// intégré via le lecteur officiel Facebook (plugins/video.php) — jamais
// re-hébergé chez nous. sourceUrl sert de lien de secours si l'intégration
// est bloquée par le navigateur (bloqueur de pub, vidéo rendue privée...).
const ORAL_MEDIA_SOURCE_URL = "https://www.facebook.com/share/r/14qVtgydwGR/";

export const ORAL_MEDIA = {
  sourceUrl: ORAL_MEDIA_SOURCE_URL,
  embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    ORAL_MEDIA_SOURCE_URL
  )}&show_text=false`,
};

// Questions réelles du Bloc 4, fournies par la cliente le 2026-09-24
// (remplacent le placeholder "[Extrait audio à intégrer]"), portant sur la
// vidéo ORAL_MEDIA ci-dessus.
export const ORAL_QUESTIONS: QcmQuestion[] = [
  {
    id: "oral-1",
    prompt:
      "Quel élément est mis en avant concernant le parcours professionnel du chercheur à l'origine de cette alerte ?",
    choices: [
      "Il a dirigé le département d'éthique de la Commission Européenne avant de rejoindre le secteur privé.",
      "Il a accumulé trois années d'expérience au sein des laboratoires de pointe d'OpenAI et d'Anthropic.",
      "Il est le cofondateur d'une entreprise rivale spécialisée dans la sécurité des réseaux informatiques.",
      "Il s'agit d'un universitaire indépendant n'ayant jamais travaillé pour de grands groupes privés.",
    ],
    correctChoice:
      "Il a accumulé trois années d'expérience au sein des laboratoires de pointe d'OpenAI et d'Anthropic.",
  },
  {
    id: "oral-2",
    prompt:
      "Qu'impute principalement ce chercheur aux entreprises leaders du marché de l'intelligence artificielle ?",
    choices: [
      "Une appropriation illégale de données personnelles protégées par le droit d'auteur.",
      "Une fuite massive de cerveaux vers le secteur des armements militaires.",
      "Une course effrénée vers une superintelligence auto-améliorante au mépris des protocoles de sécurité fondamentaux.",
      "Un ralentissement volontaire de l'innovation dans le but de maintenir un monopole économique.",
    ],
    correctChoice:
      "Une course effrénée vers une superintelligence auto-améliorante au mépris des protocoles de sécurité fondamentaux.",
  },
  {
    id: "oral-3",
    prompt:
      "Quel risque existentiel ou capacitif majeur est attribué aux futurs modèles surhumains dans cette alerte ?",
    choices: [
      "La capacité de paralyser instantanément les infrastructures informatiques et d'exceller dans tous les domaines d'ingénierie.",
      "L'épuisement total des ressources énergétiques mondiales en raison de la puissance de calcul requise.",
      "L'incapacité définitive d'aligner les valeurs morales de la machine avec les droits humains fondamentaux.",
      "La création spontanée d'un langage indécryptable rendant toute supervision humaine impossible.",
    ],
    correctChoice:
      "La capacité de paralyser instantanément les infrastructures informatiques et d'exceller dans tous les domaines d'ingénierie.",
  },
  {
    id: "oral-4",
    prompt:
      "Selon les déclarations rapportées, quelle appréhension partagée par certains dirigeants de la Tech est mise en lumière ?",
    choices: [
      "L'obsolescence programmée de l'ensemble des marchés financiers mondiaux d'ici cinq ans.",
      "L'éventualité tragique que l'essor irrépressible de l'IA ne mène à l'extinction de l'humanité d'ici la fin de la décennie.",
      "L'impossibilité d'empêcher les gouvernements d'étatiser les entreprises de sécurité technologique.",
      "L'apparition imminente d'une conscience artificielle revendiquant une autonomie juridique.",
    ],
    correctChoice:
      "L'éventualité tragique que l'essor irrépressible de l'IA ne mène à l'extinction de l'humanité d'ici la fin de la décennie.",
  },
  {
    id: "oral-5",
    prompt:
      "Quelle posture éthique et stratégique cette démission cherche-t-elle à provoquer au sein de la communauté scientifique ?",
    choices: [
      "L'interdiction définitive de tout brevet portant sur des algorithmes d'apprentissage profond.",
      "Un boycott mondial du financement privé des laboratoires de recherche en informatique.",
      "Une prise de conscience collective et une régulation stricte face aux dérives d'un déploiement précipité.",
      "Le transfert immédiat de la gouvernance de l'IA vers les institutions onusiennes.",
    ],
    correctChoice:
      "Une prise de conscience collective et une régulation stricte face aux dérives d'un déploiement précipité.",
  },
];

// maxScore par défaut /20 (Bloc 4, seul bloc encore purement QCM) —
// LEXIQUE_QUESTIONS (Partie 1 du Bloc 1) passe explicitement maxScore=10,
// le bloc entier étant composé de cette partie + la Partie 2 (voir
// partie-ouverte.ts), chacune sur 10 pts.
export function scoreQcm(
  bank: QcmQuestion[],
  answers: Record<string, string>,
  maxScore = 20
): number {
  if (bank.length === 0) return 0;
  const correct = bank.filter((q) => answers[q.id] === q.correctChoice).length;
  return Math.round((correct / bank.length) * maxScore * 100) / 100;
}
