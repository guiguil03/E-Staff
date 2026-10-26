"use client";

import { Fragment, useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { agentMatricule, fmtDate, fmtHeures, fmtMontant, fmtPeriode } from "./agentApi";

interface LignePaie {
  periode: string;
  clientNom: string;
  role: string;
  tauxHoraire: number | null;
  montantBase: number;
  montantPrime: number;
  heuresAbsence: number;
  heuresRetard: number;
  heuresSup: number;
  retenue: number;
  primeHeuresSup: number;
  netAPayer: number;
  moyenPaiement: string | null;
  statut: string;
  datePaiement: string | null;
}

interface PaiementsAgentData {
  lignes: LignePaie[];
  totalPaye: number;
  totalEnAttente: number;
  coordonneesPaiement: { type: string; numero: string; verifieLe: string | null } | null;
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";

// Mes paiements — les lignes de paie réellement établies par la RH (voir
// PaiementAgent). Rien n'est créé depuis cet écran : une période sans ligne
// n'apparaît pas, plutôt qu'un montant provisoire qui ne serait pas celui
// que la RH verse.
export default function PaiementsAgent() {
  const [data, setData] = useState<PaiementsAgentData | "loading" | "erreur">("loading");
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    const matricule = agentMatricule();
    if (!matricule) {
      setData("erreur");
      return;
    }
    apiGet<PaiementsAgentData>(`/agents/${matricule}/paiements`)
      .then(setData)
      .catch(() => setData("erreur"));
  }, []);

  if (data === "loading") {
    return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  }
  if (data === "erreur") {
    return (
      <p className="font-sans text-sm text-white/50">
        Impossible de charger vos paiements pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={CARD}>
          <p className={LABEL}>Total déjà versé</p>
          <p className="mt-2 font-display text-2xl font-bold text-accent">
            {fmtMontant(data.totalPaye)}
          </p>
        </div>
        <div className={CARD}>
          <p className={LABEL}>En attente de versement</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">
            {fmtMontant(data.totalEnAttente)}
          </p>
        </div>
        <div className={CARD}>
          <p className={LABEL}>Versé sur</p>
          <p className="mt-2 font-sans text-sm text-white">
            {data.coordonneesPaiement
              ? `${data.coordonneesPaiement.type} · ${data.coordonneesPaiement.numero}`
              : "Coordonnées non renseignées"}
          </p>
          {data.coordonneesPaiement?.verifieLe && (
            <p className="mt-1 font-sans text-xs text-white/40">
              Vérifiées le {fmtDate(data.coordonneesPaiement.verifieLe)}
            </p>
          )}
        </div>
      </div>

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Historique de paie</h3>
          {data.lignes.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">
              Aucune ligne de paie établie pour l&apos;instant.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={`${LABEL} py-2`}>Période</th>
                    <th className={`${LABEL} py-2`}>Client</th>
                    <th className={`${LABEL} py-2`}>Base</th>
                    <th className={`${LABEL} py-2`}>Retenue</th>
                    <th className={`${LABEL} py-2`}>Heures sup.</th>
                    <th className={`${LABEL} py-2`}>Prime</th>
                    <th className={`${LABEL} py-2`}>Net à payer</th>
                    <th className={`${LABEL} py-2`}>Statut</th>
                    <th className={`${LABEL} py-2`}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.lignes.map((l) => {
                    // Une ligne par période ET par client : un agent peut
                    // changer de mission en cours d'année, la clé doit
                    // combiner les deux.
                    const cle = `${l.periode}-${l.clientNom}`;
                    return (
                    <Fragment key={cle}>
                      <tr className="border-b border-white/5">
                        <td className="py-2 font-mono text-xs text-white/70">
                          {fmtPeriode(l.periode)}
                        </td>
                        <td className="py-2 font-sans text-sm text-white">{l.clientNom}</td>
                        <td className="py-2 font-mono text-xs text-white">
                          {fmtMontant(l.montantBase)}
                        </td>
                        <td className="py-2 font-mono text-xs text-white/70">
                          {l.retenue > 0 ? `− ${fmtMontant(l.retenue)}` : "—"}
                        </td>
                        <td className="py-2 font-mono text-xs text-white/70">
                          {l.primeHeuresSup > 0 ? `+ ${fmtMontant(l.primeHeuresSup)}` : "—"}
                        </td>
                        <td className="py-2 font-mono text-xs text-white/70">
                          {l.montantPrime > 0 ? `+ ${fmtMontant(l.montantPrime)}` : "—"}
                        </td>
                        <td className="py-2 font-mono text-sm text-accent">
                          {fmtMontant(l.netAPayer)}
                        </td>
                        <td className="py-2">
                          <span
                            className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                              l.statut === "paye"
                                ? "border-success/40 bg-success/10 text-success"
                                : "border-white/20 bg-white/5 text-white/60"
                            }`}
                          >
                            {l.statut === "paye" ? "Payé" : "En attente"}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() =>
                              setDetail(detail === cle ? null : cle)
                            }
                            className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
                          >
                            {detail === cle ? "Masquer" : "Détail"}
                          </button>
                        </td>
                      </tr>
                      {detail === cle && (
                        <tr className="border-b border-white/5 bg-obsidian/60">
                          <td colSpan={9} className="px-3 py-3">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <div>
                                <p className={LABEL}>Poste occupé</p>
                                <p className="mt-1 font-sans text-sm text-white">{l.role}</p>
                              </div>
                              <div>
                                <p className={LABEL}>Taux horaire</p>
                                <p className="mt-1 font-sans text-sm text-white">
                                  {l.tauxHoraire !== null ? fmtMontant(l.tauxHoraire) : "—"}
                                </p>
                              </div>
                              <div>
                                <p className={LABEL}>Retards / absences retenus</p>
                                <p className="mt-1 font-sans text-sm text-white">
                                  {fmtHeures(l.heuresRetard)} / {fmtHeures(l.heuresAbsence)}
                                </p>
                              </div>
                              <div>
                                <p className={LABEL}>Heures sup. validées</p>
                                <p className="mt-1 font-sans text-sm text-white">
                                  {fmtHeures(l.heuresSup)} (majorées de 50%)
                                </p>
                              </div>
                              <div>
                                <p className={LABEL}>Moyen de paiement</p>
                                <p className="mt-1 font-sans text-sm text-white">
                                  {l.moyenPaiement ?? "—"}
                                </p>
                              </div>
                              <div>
                                <p className={LABEL}>Date de versement</p>
                                <p className="mt-1 font-sans text-sm text-white">
                                  {fmtDate(l.datePaiement)}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 font-sans text-xs text-white/40">
            Net à payer = base − retenue (retards et absences non justifiées) + heures
            supplémentaires majorées + prime de performance. Une question sur un montant ?
            Contactez la RH.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
