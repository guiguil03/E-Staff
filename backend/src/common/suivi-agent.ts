// Règles du tableau de bord de saisie de l'agent (suivi d'activité
// journalier, alertes, cartes de rémunération). Fonctions pures, partagées
// par AgentsService : les seuils et montants sont des constantes ici pour
// qu'un changement de barème tienne en une ligne.

import { isoWeekToMonday, moisDeLaSemaine } from "./paie-agent";

// Seuils d'alerte sur le pourcentage atteint du jour : < 3% rouge, de 3% à
// moins de 5% orange (« autour de 4% »), 5% et plus vert.
export const SEUIL_ALERTE_ROUGE = 3;
export const SEUIL_FEU_VERT = 5;

// Rémunération de référence : 300 € pour un temps plein de 160 h
// (1,875 €/h). `Agent.salaireBase`, quand la RH l'a renseigné, remplace les
// 300 € — les 160 h restent la référence du taux horaire.
export const SALAIRE_BASE_REFERENCE = 300;
export const HEURES_REFERENCE_MENSUELLES = 160;
export const PRIME_HEBDO_PERFORMANCE = 15;

export const STATUTS_PRESENCE = [
  "en_ligne",
  "en_pause",
  "en_formation",
  "en_panne",
  "hors_ligne",
] as const;
export type StatutPresence = (typeof STATUTS_PRESENCE)[number];

export type NiveauAlerte = "rouge" | "orange" | "vert";

export function niveauAlerte(tauxAtteint: number): NiveauAlerte {
  if (tauxAtteint < SEUIL_ALERTE_ROUGE) return "rouge";
  if (tauxAtteint < SEUIL_FEU_VERT) return "orange";
  return "vert";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function tauxHoraireAgent(salaireBase: number | null): number {
  return round2((salaireBase ?? SALAIRE_BASE_REFERENCE) / HEURES_REFERENCE_MENSUELLES);
}

export interface JourSuivi {
  jour: Date;
  tauxAtteint: number;
  heuresTravaillees: number;
  heuresPanne: number;
  statutValidation: string;
}

export interface SemainePrime {
  semaine: string; // "AAAA-Wss"
  rang: number; // 1..n dans le mois (S1, S2...)
  // "acquise" | "perdue" | "en_cours" (semaine pas terminée ou non validée)
  etat: "acquise" | "perdue" | "en_cours";
  montant: number;
}

// Prime hebdomadaire : acquise quand la semaine est terminée, que tous ses
// jours saisis sont validés et qu'aucun n'a déclenché d'alerte orange ou
// rouge. Une semaine terminée avec une alerte est « perdue » ; sinon elle
// reste « en cours » (semaine ouverte ou journées encore à valider).
export function primesHebdo(jours: JourSuivi[], periode: string, now: Date): SemainePrime[] {
  const parSemaine = new Map<string, JourSuivi[]>();
  for (const j of jours) {
    const semaine = isoWeekLabelUtc(j.jour);
    if (moisDeLaSemaine(semaine) !== periode) continue;
    parSemaine.set(semaine, [...(parSemaine.get(semaine) ?? []), j]);
  }
  return Array.from(parSemaine.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([semaine, js], i) => {
      const dimanche = isoWeekToMonday(semaine);
      dimanche.setUTCDate(dimanche.getUTCDate() + 6);
      const terminee = dimanche.getTime() < Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const alerte = js.some((j) => niveauAlerte(j.tauxAtteint) !== "vert");
      const toutValide = js.every((j) => j.statutValidation === "valide");
      let etat: SemainePrime["etat"] = "en_cours";
      if (alerte && terminee) etat = "perdue";
      else if (!alerte && terminee && toutValide) etat = "acquise";
      return {
        semaine,
        rang: i + 1,
        etat,
        montant: etat === "acquise" ? PRIME_HEBDO_PERFORMANCE : 0,
      };
    });
}

export function isoWeekLabelUtc(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// Les quatre cartes du haut du tableau de bord, pour un mois ("AAAA-MM").
// Heures, pannes, retenues et primes ne comptent que les journées validées
// par le superviseur ; les heures saisies mais pas encore validées sont
// exposées à part (`heuresEnAttente`) pour que l'agent voie ce qui arrive.
export function cartesRemuneration(input: {
  jours: JourSuivi[];
  periode: string;
  salaireBase: number | null;
  now: Date;
}) {
  const { jours, periode, salaireBase, now } = input;
  const duMois = jours.filter(
    (j) => `${j.jour.getUTCFullYear()}-${String(j.jour.getUTCMonth() + 1).padStart(2, "0")}` === periode
  );
  const validees = duMois.filter((j) => j.statutValidation === "valide");
  const heures = round2(validees.reduce((s, j) => s + j.heuresTravaillees, 0));
  const heuresEnAttente = round2(
    duMois.filter((j) => j.statutValidation !== "valide").reduce((s, j) => s + j.heuresTravaillees, 0)
  );
  const panneHeures = round2(validees.reduce((s, j) => s + j.heuresPanne, 0));
  const base = salaireBase ?? SALAIRE_BASE_REFERENCE;
  const tauxHoraire = tauxHoraireAgent(salaireBase);
  const retenues = round2(panneHeures * tauxHoraire);
  const semaines = primesHebdo(duMois, periode, now);
  const totalPrimes = round2(semaines.reduce((s, w) => s + w.montant, 0));

  return {
    periode,
    salaire: {
      base,
      heuresReference: HEURES_REFERENCE_MENSUELLES,
      tauxHoraire,
      heuresValidees: heures,
      heuresEnAttente,
      gagne: round2(heures * tauxHoraire),
    },
    pannes: { heures: panneHeures, retenues },
    primes: { semaines, total: totalPrimes, montantParSemaine: PRIME_HEBDO_PERFORMANCE },
    net: round2(base - retenues + totalPrimes),
  };
}
