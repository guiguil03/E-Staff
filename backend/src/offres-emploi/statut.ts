// Statut d'une offre d'emploi, calculé — jamais saisi à la main (demande
// cliente du 2026-09-19 : « dès que les places pourvues = places totales,
// le bouton Postuler se désactive automatiquement et le badge passe en
// rouge »). La RH ne renseigne que les places, la date limite et, si
// besoin, une fermeture manuelle.
export type StatutOffre = "ouvert" | "presque_complet" | "cloture";
export type MotifCloture = "complet" | "date_limite" | "manuel";

export interface OffreStatutInput {
  placesTotal: number;
  placesPourvues: number;
  dateLimite: Date | null;
  cloturee: boolean;
}

export interface OffreStatut {
  statut: StatutOffre;
  motifCloture: MotifCloture | null;
  placesRestantes: number;
  // Pourcentage de postes attribués (0-100), pour la jauge de progression.
  tauxRemplissage: number;
}

// « Dernières places » : au plus 20 % des places restantes, et jamais moins
// d'une — 1 à 2 places sur 10, 1 place sur 3.
export function seuilDernieresPlaces(placesTotal: number): number {
  return Math.max(1, Math.floor(placesTotal * 0.2));
}

export function calculerStatut(offre: OffreStatutInput, now: Date = new Date()): OffreStatut {
  const total = Math.max(0, offre.placesTotal);
  const pourvues = Math.min(Math.max(0, offre.placesPourvues), total);
  const placesRestantes = total - pourvues;
  const tauxRemplissage = total > 0 ? Math.round((pourvues / total) * 100) : 100;

  let motifCloture: MotifCloture | null = null;
  if (offre.cloturee) motifCloture = "manuel";
  else if (placesRestantes === 0) motifCloture = "complet";
  else if (offre.dateLimite && offre.dateLimite.getTime() < now.getTime()) motifCloture = "date_limite";

  const statut: StatutOffre = motifCloture
    ? "cloture"
    : placesRestantes <= seuilDernieresPlaces(total)
      ? "presque_complet"
      : "ouvert";

  return { statut, motifCloture, placesRestantes, tauxRemplissage };
}
