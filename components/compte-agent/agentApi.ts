import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

// Matricule de la session agent — les routes de l'Espace Agent sont
// indexées par matricule (`/agents/:matricule/...`) et l'AgentGuard exige
// que la session corresponde exactement à celui de l'URL : un matricule
// deviné ne donne accès à rien.
export function agentMatricule(): string | null {
  return typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
}

export function fmtDate(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// "AAAA-Wss" -> "S37 · 2026" (même convention d'affichage que
// EncaissementsFormationPanel / ApprenantDashboard).
export function fmtSemaine(isoWeek: string): string {
  const [annee, semaine] = isoWeek.split("-W");
  return `S${semaine} · ${annee}`;
}

// "AAAA-MM" -> "09/2026".
export function fmtPeriode(periode: string): string {
  const [annee, mois] = periode.split("-");
  return `${mois}/${annee}`;
}

// Montants en Ariary, comme le reste du produit (pas de devise modélisée).
export function fmtMontant(montant: number | null | undefined): string {
  if (montant === null || montant === undefined) return "—";
  return `${Math.round(montant).toLocaleString("fr-FR")} Ar`;
}

export function fmtTaux(taux: number | null | undefined): string {
  return taux === null || taux === undefined ? "—" : `${taux}%`;
}

export function fmtHeures(heures: number | null | undefined): string {
  return heures === null || heures === undefined ? "—" : `${heures} h`;
}

export const STATUT_AGENT_LABELS: Record<string, string> = {
  essai: "Période d'essai",
  actif: "En poste",
  inactif: "Compte désactivé",
};
