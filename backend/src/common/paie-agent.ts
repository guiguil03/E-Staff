// Formule de paie d'un agent de production, partagée entre la vue RH
// (ProductionService.getDetailPaieAgents — "qui je paie ce mois-ci") et
// l'Espace Agent (AgentsService.getPaiements — "combien on me paie ce
// mois-ci"). Volontairement extraite ici plutôt que dupliquée dans les deux
// services : les deux écrans doivent afficher le MÊME net à payer, sinon
// l'agent lit un chiffre que la RH ne reconnaît pas.

// Heures mensuelles standard utilisées pour convertir un tarif négocié
// (mensuel) en taux horaire — 173,33h/mois est la référence usuelle pour un
// temps plein 40h/semaine (52 semaines / 12 mois × 40h). Pas de donnée
// contractuelle par agent pour affiner ce chiffre à ce jour.
export const HEURES_MENSUELLES_STANDARD = 173.33;
// Majoration heures supplémentaires — valeur par défaut usuelle (+50%), pas
// de barème négocié par agent en base.
export const MAJORATION_HEURES_SUP = 1.5;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Lundi de la semaine ISO donnée — sert à rattacher un SuiviAgentHebdo
// (suivi par semaine) à un mois de paie ("AAAA-MM") pour agréger le
// pointage/les métriques de la période. Approximation : une semaine à
// cheval sur deux mois est rattachée au mois de son lundi.
export function isoWeekToMonday(label: string): Date {
  const [yearStr, weekStr] = label.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayNum = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4DayNum + 1);
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

export function moisDeLaSemaine(label: string): string {
  const monday = isoWeekToMonday(label);
  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface PointageAgent {
  heuresAbsenceNonJustifiee: number;
  heuresRetardCumulees: number;
  heuresSupValidees: number;
}

// Agrège le pointage des semaines rattachées à un mois de paie.
export function agregerPointage(
  suivis: ({ semaine: string } & PointageAgent)[],
  periode: string
): { heuresAbsence: number; heuresRetard: number; heuresSup: number } {
  const duMois = suivis.filter((s) => moisDeLaSemaine(s.semaine) === periode);
  return {
    heuresAbsence: duMois.reduce((sum, s) => sum + s.heuresAbsenceNonJustifiee, 0),
    heuresRetard: duMois.reduce((sum, s) => sum + s.heuresRetardCumulees, 0),
    heuresSup: duMois.reduce((sum, s) => sum + s.heuresSupValidees, 0),
  };
}

export interface CalculPaieAgent {
  /** Taux horaire dérivé du tarif négocié — null si aucun tarif connu. */
  tauxHoraire: number | null;
  /** Retenue sur salaire : absences non justifiées + retards cumulés. */
  retenue: number;
  /** Prime d'heures supplémentaires validées (+50%). */
  primeHeuresSup: number;
  /** Base − retenue + heures sup + prime de performance. */
  netAPayer: number;
}

// `tarif` sert au taux horaire (donc à la retenue et aux heures sup) ;
// `montantBase`/`montantPrime` sont les montants réellement retenus par la
// RH sur la ligne de paie (corrigeables), d'où les deux entrées distinctes.
export function calculerPaieAgent(input: {
  tarif: number;
  montantBase: number;
  montantPrime: number;
  heuresAbsence: number;
  heuresRetard: number;
  heuresSup: number;
}): CalculPaieAgent {
  const { tarif, montantBase, montantPrime, heuresAbsence, heuresRetard, heuresSup } = input;
  const tauxHoraire = tarif ? round2(tarif / HEURES_MENSUELLES_STANDARD) : null;
  // Retenue sur salaire — absences non justifiées ET retards cumulés, au
  // même taux horaire (voir la maquette "FENÊTRE DÉTAILLÉE : PAIE ET
  // PERFORMANCES AGENTS", qui déduit aussi les retards).
  const retenue = tauxHoraire !== null ? round2(tauxHoraire * (heuresAbsence + heuresRetard)) : 0;
  const primeHeuresSup =
    tauxHoraire !== null ? round2(tauxHoraire * heuresSup * MAJORATION_HEURES_SUP) : 0;
  return {
    tauxHoraire,
    retenue,
    primeHeuresSup,
    netAPayer: round2(montantBase - retenue + primeHeuresSup + montantPrime),
  };
}
