// Banques de questions auto-corrigées (lexique + compréhension orale).
//
// LEXIQUE_QUESTIONS = "Partie 1" du Bloc 1 (QCM linguistique et
// stylistique, 10 pts sur les 20 du bloc — voir PARTIE_OUVERTE_CONTENT dans
// partie-ouverte.ts pour la "Partie 2", 10 pts notés par le formateur).
// Contenu réel fourni par la cliente, 2e version le 2026-08-25 (remplace un
// premier jeu de 10 questions envoyé plus tôt le même jour, jugé pas encore
// au niveau souhaité). ORAL_QUESTIONS reste en PLACEHOLDER (le cahier des
// charges ne fournit pas encore le contenu réel de cette épreuve).
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

export const ORAL_QUESTIONS: QcmQuestion[] = [
  {
    id: "oral-1",
    prompt:
      "[Extrait audio à intégrer] Quel est le sujet principal de l'appel ?",
    choices: [
      "Un retard de livraison",
      "Une demande de remboursement",
      "Une nouvelle offre commerciale",
      "Une réclamation sur la facturation",
    ],
    correctChoice: "Un retard de livraison",
  },
  {
    id: "oral-2",
    prompt: "[Extrait audio à intégrer] Quel est le ton du client au début de l'appel ?",
    choices: ["Agacé", "Enthousiaste", "Indifférent", "Amusé"],
    correctChoice: "Agacé",
  },
  {
    id: "oral-3",
    prompt: "[Extrait audio à intégrer] Que propose l'agent pour résoudre la situation ?",
    choices: [
      "Un geste commercial et un nouveau délai",
      "Une annulation pure et simple",
      "Un transfert vers un autre service",
      "Aucune solution",
    ],
    correctChoice: "Un geste commercial et un nouveau délai",
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
