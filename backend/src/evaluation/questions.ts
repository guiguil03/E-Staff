// Banques de questions auto-corrigées (lexique + compréhension orale).
//
// PLACEHOLDER : le cahier des charges ne fournit pas le contenu réel de ces
// deux épreuves — seul le principe ("correction automatique") est spécifié.
// Ce fichier contient un petit jeu d'exemple pour que le parcours candidat
// et le moteur de notation soient fonctionnels de bout en bout ; à remplacer
// par le contenu réel fourni par la cliente avant mise en production.
export interface QcmQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctChoice: string;
}

export const LEXIQUE_QUESTIONS: QcmQuestion[] = [
  {
    id: "lex-1",
    prompt: "Quel mot est un synonyme de « pertinent » ?",
    choices: ["Approprié", "Aléatoire", "Distrait", "Réticent"],
    correctChoice: "Approprié",
  },
  {
    id: "lex-2",
    prompt: "Complétez : « Nous vous recontacterons dans les meilleurs ___ »",
    choices: ["délais", "temps", "moments", "instants"],
    correctChoice: "délais",
  },
  {
    id: "lex-3",
    prompt: "Quel terme désigne un accord formel entre deux parties ?",
    choices: ["Convention", "Confusion", "Conviction", "Consultation"],
    correctChoice: "Convention",
  },
  {
    id: "lex-4",
    prompt: "« Il a fait preuve de ___ face à la critique. » (calme, sang-froid)",
    choices: ["circonspection", "irritation", "négligence", "impatience"],
    correctChoice: "circonspection",
  },
  {
    id: "lex-5",
    prompt: "Quel mot est le plus formel pour « annuler un rendez-vous » ?",
    choices: [
      "Se désister d'un rendez-vous",
      "Zapper un rendez-vous",
      "Laisser tomber un rendez-vous",
      "Oublier un rendez-vous",
    ],
    correctChoice: "Se désister d'un rendez-vous",
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

export function scoreQcm(
  bank: QcmQuestion[],
  answers: Record<string, string>
): number {
  if (bank.length === 0) return 0;
  const correct = bank.filter((q) => answers[q.id] === q.correctChoice).length;
  return Math.round((correct / bank.length) * 20 * 100) / 100; // note /20
}
