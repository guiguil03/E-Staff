// Données d'exemple pour le Cockpit Formateur — module 4 (Tour de contrôle
// superviseurs) de la roadmap n'existe pas encore côté backend (pas de
// vraies tables groupes/rendus/vivier). Même logique que le Compte
// Apprenant : du contenu plausible pour valider le design, pas de vraie
// donnée. À remplacer une fois le module construit.

export interface CompetencyScore {
  key: string;
  label: string;
  score: number; // /20
}

export interface Apprenant {
  id: string;
  firstName: string;
  lastName: string;
  groupe: string; // "A".."F"
  competencies: CompetencyScore[];
  moyenneGlobale: number; // /100
  history: { label: string; moyenne: number }[];
  tauxAbsence: number;
  retards: number;
  alerteDecrochage: boolean;
}

const COMPETENCY_LABELS = [
  { key: "comprehension_orale", label: "Compréhension orale" },
  { key: "expression_orale", label: "Expression orale" },
  { key: "comprehension_ecrite", label: "Compréhension écrite" },
  { key: "expression_ecrite", label: "Expression écrite" },
  { key: "posture_eloquence", label: "Posture & Éloquence" },
];

const FIRST_NAMES = [
  "Fara", "Njaka", "Tiana", "Mihaja", "Vola", "Hasina", "Naina", "Rindra",
  "Andry", "Soa", "Lova", "Tojo", "Miora", "Fanja", "Zo", "Tahina", "Anja",
  "Feno", "Kanto", "Dera", "Manda", "Tsiory", "Iavo", "Rado", "Sitraka",
  "Onja", "Havana", "Ony", "Mamy", "Zanaka",
];

function makeApprenant(
  index: number,
  groupe: string,
  moyenneGlobale: number,
  alerteDecrochage = false
): Apprenant {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  // Répartit la moyenne globale (/100) en 5 scores /20 avec une légère
  // variation pour que les barres ne soient pas toutes identiques.
  const base = moyenneGlobale / 5;
  const competencies = COMPETENCY_LABELS.map((c, i) => ({
    ...c,
    score: Math.max(4, Math.min(20, Math.round(base + ((i % 3) - 1) * 1.5))),
  }));
  return {
    id: `apprenant-${index + 1}`,
    firstName,
    lastName: `${String.fromCharCode(65 + (index % 26))}.`,
    groupe,
    competencies,
    moyenneGlobale,
    history: [
      { label: "S1", moyenne: Math.max(30, moyenneGlobale - 9) },
      { label: "S2", moyenne: Math.max(30, moyenneGlobale - 5) },
      { label: "S3", moyenne: Math.max(30, moyenneGlobale - 2) },
      { label: "S4", moyenne: moyenneGlobale },
    ],
    tauxAbsence: alerteDecrochage ? 20 : Math.round(Math.random() * 8),
    retards: alerteDecrochage ? 3 : Math.round(Math.random() * 2),
    alerteDecrochage,
  };
}

interface GroupSeed {
  key: string;
  moyenne: number;
  variations: number[];
}

const GROUP_SEEDS: GroupSeed[] = [
  { key: "A", moyenne: 85, variations: [4, -3, 2, -2, 3] },
  { key: "B", moyenne: 78, variations: [3, -4, 1, -1, 5] },
  { key: "C", moyenne: 65, variations: [5, -6, 2, -3, 4] },
  { key: "D", moyenne: 80, variations: [2, -2, 3, -4, 1] },
  { key: "E", moyenne: 52, variations: [6, -8, 3, -5, 2] },
  { key: "F", moyenne: 68, variations: [3, -3, 2, -2, 4] },
];

export const APPRENANTS: Apprenant[] = GROUP_SEEDS.flatMap((group, gi) =>
  group.variations.map((v, i) =>
    makeApprenant(
      gi * 5 + i,
      group.key,
      Math.max(35, Math.min(96, group.moyenne + v)),
      group.key === "E" && i === 1
    )
  )
);

function groupStatut(moyenne: number): "vert" | "orange" | "rouge" {
  if (moyenne >= 75) return "vert";
  if (moyenne >= 60) return "orange";
  return "rouge";
}

export const GROUPES = GROUP_SEEDS.map((g) => {
  const apprenants = APPRENANTS.filter((a) => a.groupe === g.key);
  const moyenne = Math.round(
    apprenants.reduce((sum, a) => sum + a.moyenneGlobale, 0) / apprenants.length
  );
  return {
    key: g.key,
    label: `Groupe ${g.key}`,
    moyenne,
    statut: groupStatut(moyenne),
    apprenantIds: apprenants.map((a) => a.id),
  };
});

export const GLOBAL_C1_RATE = Math.round(
  (APPRENANTS.filter((a) => a.moyenneGlobale >= 75).length / APPRENANTS.length) * 100
);

export const VIVIER_C1 = APPRENANTS.filter((a) => a.moyenneGlobale >= 75);

export interface SubmissionQueueItem {
  id: string;
  apprenantId: string;
  type: "Vidéo" | "Audio" | "Texte";
  exercice: string;
  soumisDepuis: string;
}

export const SUBMISSION_QUEUE: SubmissionQueueItem[] = [
  { id: "sub-1", apprenantId: "apprenant-3", type: "Audio", exercice: "Pitch de présentation 60s", soumisDepuis: "il y a 40 min" },
  { id: "sub-2", apprenantId: "apprenant-8", type: "Vidéo", exercice: "Atelier posture non-verbale", soumisDepuis: "il y a 1h30" },
  { id: "sub-3", apprenantId: "apprenant-14", type: "Texte", exercice: "Rédaction email support", soumisDepuis: "il y a 2h" },
  { id: "sub-4", apprenantId: "apprenant-22", type: "Audio", exercice: "Appel à blanc — objection budget", soumisDepuis: "il y a 3h" },
  { id: "sub-5", apprenantId: "apprenant-27", type: "Vidéo", exercice: "Débat plateau télé", soumisDepuis: "hier" },
  { id: "sub-6", apprenantId: "apprenant-6", type: "Texte", exercice: "Cas pratique — email client", soumisDepuis: "hier" },
];

export const BROADCAST_TARGETS = [
  { key: "tous", label: "Tous les apprenants (30)" },
  ...GROUPES.map((g) => ({ key: g.key, label: g.label })),
];

// Chiffres pré-remplis pour le Rapport Hebdomadaire (Constat).
export const WEEKLY_REPORT_STATS = {
  moyenneGenerale: Math.round(
    APPRENANTS.reduce((sum, a) => sum + a.moyenneGlobale, 0) / APPRENANTS.length
  ),
  evolutionVsSemaineN1: 3, // pts, vs moyenne générale de la semaine précédente
  groupesEnBaisse: 2,
  tauxPresenceGlobal: Math.round(
    100 -
      (APPRENANTS.reduce((sum, a) => sum + a.tauxAbsence, 0) / APPRENANTS.length)
  ),
  rendusCorriges: 24,
  alertesDecrochageTraitees: APPRENANTS.filter((a) => a.alerteDecrochage).length,
  nouveauxVivierC1: 2,
};
