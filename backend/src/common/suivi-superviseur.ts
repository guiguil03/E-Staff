// Règles de rémunération du superviseur (cartes de son tableau de bord).
// Fonctions pures, partagées par SuperviseursService : barème en constantes
// pour qu'un changement tienne en une ligne.

import { isoWeekToMonday, moisDeLaSemaine } from "./paie-agent";
import { type JourSuivi, primesHebdo } from "./suivi-agent";

// Fixe de référence : 400 € pour un temps plein de 160 h (2,50 €/h).
export const SALAIRE_BASE_SUPERVISEUR = 400;
export const HEURES_REFERENCE_SUPERVISEUR = 160;
// Prime hebdomadaire : 20 € quand au moins 7 agents sur 10 (70 %) sont
// restés au vert toute la semaine.
export const PRIME_HEBDO_SUPERVISEUR = 20;
export const PART_AGENTS_VERTS_REQUISE = 0.7;
// Réunions à planifier par semaine (rappel affiché, sans sanction).
export const REUNIONS_MIN_PAR_SEMAINE = 1;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface EquipeAgentJours {
  agentId: string;
  jours: JourSuivi[];
}

export interface SemainePrimeSuperviseur {
  semaine: string;
  rang: number;
  agentsVerts: number;
  agentsTotal: number;
  etat: "acquise" | "perdue" | "en_cours";
  montant: number;
}

// Un agent est « vert » sur une semaine terminée quand sa prime hebdo est
// acquise (journées toutes validées et sans alerte orange/rouge — règle de
// l'agent, voir primesHebdo). Le dénominateur est l'effectif supervisé, pas
// les seuls agents ayant saisi : un agent sans saisie n'est pas au vert.
export function primesSuperviseur(
  equipe: EquipeAgentJours[],
  periode: string,
  now: Date
): SemainePrimeSuperviseur[] {
  const parAgent = equipe.map((a) => ({
    agentId: a.agentId,
    semaines: primesHebdo(a.jours, periode, now),
  }));
  const semaines = Array.from(
    new Set(parAgent.flatMap((a) => a.semaines.map((s) => s.semaine)))
  ).sort();
  const total = equipe.length;
  const aujourdhui = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  return semaines.map((semaine, i) => {
    const dimanche = isoWeekToMonday(semaine);
    dimanche.setUTCDate(dimanche.getUTCDate() + 6);
    const terminee = dimanche.getTime() < aujourdhui;
    const verts = parAgent.filter((a) =>
      a.semaines.some((s) => s.semaine === semaine && s.etat === "acquise")
    ).length;
    const atteint = total > 0 && verts / total >= PART_AGENTS_VERTS_REQUISE;
    const etat: SemainePrimeSuperviseur["etat"] = !terminee ? "en_cours" : atteint ? "acquise" : "perdue";
    return {
      semaine,
      rang: i + 1,
      agentsVerts: verts,
      agentsTotal: total,
      etat,
      montant: etat === "acquise" ? PRIME_HEBDO_SUPERVISEUR : 0,
    };
  });
}

export interface AbsenceSuivi {
  jour: Date;
  heures: number;
  justifiee: boolean;
}

export function cartesSuperviseur(input: {
  equipe: EquipeAgentJours[];
  absences: AbsenceSuivi[];
  periode: string;
  now: Date;
}) {
  const { equipe, absences, periode, now } = input;
  const tauxHoraire = round2(SALAIRE_BASE_SUPERVISEUR / HEURES_REFERENCE_SUPERVISEUR);
  const nonJustifiees = absences.filter(
    (a) =>
      !a.justifiee &&
      `${a.jour.getUTCFullYear()}-${String(a.jour.getUTCMonth() + 1).padStart(2, "0")}` === periode
  );
  const heuresAbsence = round2(nonJustifiees.reduce((s, a) => s + a.heures, 0));
  const retenues = round2(heuresAbsence * tauxHoraire);
  const semaines = primesSuperviseur(equipe, periode, now);
  const totalPrimes = round2(semaines.reduce((s, w) => s + w.montant, 0));

  return {
    periode,
    salaire: {
      base: SALAIRE_BASE_SUPERVISEUR,
      heuresReference: HEURES_REFERENCE_SUPERVISEUR,
      tauxHoraire,
    },
    primes: {
      semaines,
      total: totalPrimes,
      montantParSemaine: PRIME_HEBDO_SUPERVISEUR,
      partRequise: PART_AGENTS_VERTS_REQUISE,
    },
    absences: { heures: heuresAbsence, retenues },
    net: round2(SALAIRE_BASE_SUPERVISEUR - retenues + totalPrimes),
  };
}

export { moisDeLaSemaine };
