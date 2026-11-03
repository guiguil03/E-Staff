import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

// Matricule de la session entreprise — les routes de l'Espace Entreprise
// sont indexées par matricule (`/entreprises-comptes/:matricule/...`) et
// l'EntrepriseGuard exige que la session corresponde exactement à celui de
// l'URL (même principe que agentMatricule/compte-agent).
export function entrepriseMatricule(): string | null {
  return typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
}

export function fmtDate(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

export function fmtDateHeure(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—";
}

export function fmtMontant(montant: number | null | undefined): string {
  if (montant === null || montant === undefined) return "—";
  return `${Math.round(montant).toLocaleString("fr-FR")} €`;
}

export function fmtPeriode(periode: string): string {
  const [annee, mois] = periode.split("-");
  return `${mois}/${annee}`;
}

export const STATUT_PRESENCE_LABELS: Record<string, { label: string; couleur: string }> = {
  en_ligne: { label: "En ligne", couleur: "bg-statusGreen" },
  en_pause: { label: "En pause", couleur: "bg-statusOrange" },
  en_formation: { label: "En formation", couleur: "bg-teal" },
  en_panne: { label: "En panne", couleur: "bg-statusRed" },
  hors_ligne: { label: "Hors ligne", couleur: "bg-white/30" },
};

export const INTERET_STATUT_LABELS: Record<string, string> = {
  nouveau: "Transmis à la RH",
  vu: "Vu par la RH",
  propose: "Proposé",
  affecte: "Affecté à votre équipe",
  refuse: "Non disponible",
};
