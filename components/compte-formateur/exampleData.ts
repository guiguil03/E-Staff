// Ex-données d'exemple pour le Cockpit Formateur (module "Tour de contrôle
// superviseurs" de la roadmap, jamais construit côté backend). Les grosses
// données mock (APPRENANTS, GROUPES, VIVIER_C1, SUBMISSION_QUEUE,
// WEEKLY_REPORT_STATS...) ont été retirées (2026-10-08) : tous les écrans
// qu'elles servaient à faire tourner sont depuis passés sur les vrais
// agrégats (/cockpit/*, voir backend/src/cockpit/) — plus aucun composant
// ne les importait. Ne restent que les quelques utilitaires encore
// réellement utilisés.

// Pont vers le vrai backend : l'id de démo "apprenant-N" correspond
// exactement au matricule ETF-2026-000N planté par prisma/seed.ts (même
// index de génération des deux côtés) — voir le commentaire équivalent dans
// backend/src/notation/notation.service.ts. Permet d'appeler les endpoints
// Notation/classe-virtuelle (qui identifient l'apprenant par matricule)
// sans requête réseau supplémentaire pour résoudre l'id.
export function apprenantMatricule(apprenantId: string): string {
  const n = apprenantId.split("-")[1] ?? "0";
  return `ETF-2026-${n.padStart(4, "0")}`;
}

// Inverse de apprenantMatricule — utilisé par les widgets branchés sur les
// vrais agrégats du Cockpit (/cockpit/*, voir backend/src/cockpit/) pour
// naviguer vers la Fiche Apprenant (/compte/formateur/apprenants/[id]).
export function apprenantIdFromMatricule(matricule: string): string {
  const n = parseInt(matricule.split("-")[2] ?? "0", 10);
  return `apprenant-${n}`;
}

// Planning par Groupe & Moyenne de Séance — 12 séances par groupe. Les
// séances 1-4 sont considérées "passées" ; 5-12 sont à venir, donc sans
// note pré-remplie — le formateur les saisit lui-même.
export const SEANCE_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);
export const DERNIERE_SEANCE_PASSEE = 4;

export const OBJECTIFS_PAR_DEFAUT: Record<number, string> = {
  1: "Consolidation des fondamentaux grammaticaux et lexicaux.",
  2: "Structuration de l'argumentation à l'oral et à l'écrit.",
  3: "Travail sur l'aisance orale et la gestion du trac.",
  4: "Renforcement du vocabulaire professionnel sectoriel.",
};
