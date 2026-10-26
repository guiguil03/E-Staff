"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import DailyLineChart from "@/components/compte-admin/DailyLineChart";
import ComparativeBarChart from "@/components/compte-admin/ComparativeBarChart";
import { apiGet } from "@/lib/api";
import {
  agentMatricule,
  fmtDate,
  fmtHeures,
  fmtSemaine,
  fmtTaux,
  STATUT_AGENT_LABELS,
} from "./agentApi";

interface Releve {
  jour: string;
  realise: number | null;
  tauxAtteint: number;
  heuresTravaillees: number;
}

interface AgentDashboardData {
  matricule: string;
  prenom: string;
  nom: string;
  poste: string | null;
  statut: string;
  dateEmbauche: string | null;
  mission: {
    clientNom: string;
    role: string;
    dateDebut: string;
    dateFin: string | null;
    active: boolean;
    superviseurNom: string | null;
    objectifJournalier: number | null;
    objectifHebdo: number | null;
    qualityScore: number | null;
  } | null;
  releveDuJour: Releve | null;
  tauxJournaliers: Releve[];
  comparatifHebdo: {
    semaine: string;
    joursSaisis: number;
    realise: number | null;
    heuresTravaillees: number;
    tauxAtteint: number;
  }[];
  tempsTravaille: {
    semaine: string;
    heuresSemaine: number;
    periode: string;
    heuresMois: number;
    heuresTotal: number;
    joursTravailles: number;
    moyenneHeuresParJour: number | null;
  };
  synthese: { joursSaisis: number; tauxMoyen: number | null; joursObjectifAtteint: number };
  pointageHebdo: {
    semaine: string;
    heuresRetardCumulees: number;
    heuresAbsenceNonJustifiee: number;
    heuresSupValidees: number;
    nbRetards: number;
    tauxAbsence: number | null;
  } | null;
  performanceHebdo: {
    semaine: string;
    concretisations: number;
    nbVentes: number;
    rdvValides: number;
    caRealise: number;
    remarques: string | null;
  } | null;
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={CARD}>
      <p className={LABEL}>{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-accent">{value}</p>
      {hint && <p className="mt-1 font-sans text-xs text-white/50">{hint}</p>}
    </div>
  );
}

// Tableau de bord de l'agent : ses performances, son temps travaillé et ses
// taux d'atteinte (journalier et hebdomadaire). Tout vient des relevés
// réellement saisis par la RH/le superviseur (voir SuiviAgentJournalier et
// SuiviAgentHebdo) — un bloc sans donnée affiche un état vide explicite
// plutôt qu'un chiffre inventé.
export default function AgentDashboard() {
  const [data, setData] = useState<AgentDashboardData | "loading" | "erreur">("loading");

  useEffect(() => {
    const matricule = agentMatricule();
    if (!matricule) {
      setData("erreur");
      return;
    }
    apiGet<AgentDashboardData>(`/agents/${matricule}/dashboard`)
      .then(setData)
      .catch(() => setData("erreur"));
  }, []);

  if (data === "loading") {
    return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  }
  if (data === "erreur") {
    return (
      <p className="font-sans text-sm text-white/50">
        Impossible de charger vos performances pour le moment.
      </p>
    );
  }

  const { mission, tempsTravaille, synthese } = data;

  return (
    <div className="space-y-4">
      <Reveal>
        <div className={CARD}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={LABEL}>Agent · {data.matricule}</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-white">
                {data.prenom} {data.nom}
              </h2>
              <p className="mt-1 font-sans text-sm text-white/60">
                {data.poste ?? "Poste non renseigné"}
                {data.dateEmbauche ? ` · depuis le ${fmtDate(data.dateEmbauche)}` : ""}
              </p>
            </div>
            <span className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-accent">
              {STATUT_AGENT_LABELS[data.statut] ?? data.statut}
            </span>
          </div>

          {mission ? (
            <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className={LABEL}>Client</p>
                <p className="mt-1 font-sans text-sm text-white">{mission.clientNom}</p>
              </div>
              <div>
                <p className={LABEL}>Poste sur la mission</p>
                <p className="mt-1 font-sans text-sm text-white">{mission.role}</p>
              </div>
              <div>
                <p className={LABEL}>Superviseur</p>
                <p className="mt-1 font-sans text-sm text-white">
                  {mission.superviseurNom ?? "—"}
                </p>
              </div>
              <div>
                <p className={LABEL}>{mission.active ? "En mission depuis" : "Mission terminée"}</p>
                <p className="mt-1 font-sans text-sm text-white">
                  {mission.active
                    ? fmtDate(mission.dateDebut)
                    : `${fmtDate(mission.dateDebut)} → ${fmtDate(mission.dateFin)}`}
                </p>
              </div>
              <div>
                <p className={LABEL}>Objectif journalier</p>
                <p className="mt-1 font-sans text-sm text-white">
                  {mission.objectifJournalier ?? "Non fixé"}
                </p>
              </div>
              <div>
                <p className={LABEL}>Objectif hebdomadaire</p>
                <p className="mt-1 font-sans text-sm text-white">
                  {mission.objectifHebdo ?? "Non fixé"}
                </p>
              </div>
              <div>
                <p className={LABEL}>Qualité de service</p>
                <p className="mt-1 font-sans text-sm text-white">
                  {mission.qualityScore !== null ? `${mission.qualityScore}/5` : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 border-t border-white/10 pt-4 font-sans text-sm text-white/50">
              Vous n&apos;êtes affecté à aucune mission pour l&apos;instant. Vos performances
              s&apos;afficheront ici dès votre première affectation chez un client.
            </p>
          )}
        </div>
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Objectif du jour"
          value={fmtTaux(data.releveDuJour?.tauxAtteint ?? null)}
          hint={
            data.releveDuJour
              ? `${data.releveDuJour.realise ?? "—"} réalisé · ${fmtHeures(data.releveDuJour.heuresTravaillees)}`
              : "Aucun relevé saisi aujourd'hui"
          }
        />
        <Kpi
          label="Taux moyen (30 j)"
          value={fmtTaux(synthese.tauxMoyen)}
          hint={`${synthese.joursSaisis} jour(s) saisi(s)`}
        />
        <Kpi
          label="Objectif atteint"
          value={
            synthese.joursSaisis > 0
              ? `${synthese.joursObjectifAtteint}/${synthese.joursSaisis} j`
              : "—"
          }
          hint="Jours à 100% ou plus"
        />
        <Kpi
          label="Heures cette semaine"
          value={fmtHeures(tempsTravaille.heuresSemaine)}
          hint={`${fmtSemaine(tempsTravaille.semaine)}`}
        />
      </div>

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">
            Objectif atteint — par jour
          </h3>
          <p className="mt-1 font-sans text-xs text-white/50">
            30 derniers jours saisis par votre superviseur.
          </p>
          {data.tauxJournaliers.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-white/50">
              Aucun relevé journalier pour l&apos;instant.
            </p>
          ) : (
            <DailyLineChart
              data={data.tauxJournaliers.map((r) => ({
                label: new Date(r.jour).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                }),
                value: r.tauxAtteint,
              }))}
            />
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">
            Comparatif hebdomadaire
          </h3>
          <p className="mt-1 font-sans text-xs text-white/50">
            {mission?.objectifHebdo
              ? `Réalisé de la semaine sur votre objectif hebdomadaire (${mission.objectifHebdo}).`
              : "Moyenne de vos taux journaliers, faute d'objectif hebdomadaire fixé."}
          </p>
          {data.comparatifHebdo.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-white/50">
              Aucune semaine renseignée pour l&apos;instant.
            </p>
          ) : (
            <>
              <ComparativeBarChart
                data={data.comparatifHebdo.map((s) => ({
                  label: `S${s.semaine.split("-W")[1]}`,
                  value: s.tauxAtteint,
                }))}
                maxValue={Math.max(100, ...data.comparatifHebdo.map((s) => s.tauxAtteint))}
                valueSuffix="%"
              />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className={`${LABEL} py-2`}>Semaine</th>
                      <th className={`${LABEL} py-2`}>Réalisé</th>
                      <th className={`${LABEL} py-2`}>Taux</th>
                      <th className={`${LABEL} py-2`}>Heures</th>
                      <th className={`${LABEL} py-2`}>Jours saisis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.comparatifHebdo].reverse().map((s) => (
                      <tr key={s.semaine} className="border-b border-white/5">
                        <td className="py-2 font-mono text-xs text-white/70">
                          {fmtSemaine(s.semaine)}
                        </td>
                        <td className="py-2 font-sans text-sm text-white">{s.realise ?? "—"}</td>
                        <td className="py-2 font-sans text-sm text-accent">
                          {fmtTaux(s.tauxAtteint)}
                        </td>
                        <td className="py-2 font-sans text-sm text-white">
                          {fmtHeures(s.heuresTravaillees)}
                        </td>
                        <td className="py-2 font-sans text-sm text-white/70">{s.joursSaisis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Reveal>

      <div className="grid gap-3 lg:grid-cols-3">
        <Reveal>
          <div className={`${CARD} h-full`}>
            <h3 className="font-display text-lg font-semibold text-white">Temps travaillé</h3>
            <dl className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <dt className="font-sans text-sm text-white/60">
                  Semaine ({fmtSemaine(tempsTravaille.semaine)})
                </dt>
                <dd className="font-mono text-sm text-white">
                  {fmtHeures(tempsTravaille.heuresSemaine)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-sans text-sm text-white/60">Mois en cours</dt>
                <dd className="font-mono text-sm text-white">
                  {fmtHeures(tempsTravaille.heuresMois)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-sans text-sm text-white/60">Cumul sur la mission</dt>
                <dd className="font-mono text-sm text-white">
                  {fmtHeures(tempsTravaille.heuresTotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-sans text-sm text-white/60">Moyenne par jour travaillé</dt>
                <dd className="font-mono text-sm text-white">
                  {fmtHeures(tempsTravaille.moyenneHeuresParJour)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-sans text-sm text-white/60">Jours travaillés</dt>
                <dd className="font-mono text-sm text-white">{tempsTravaille.joursTravailles}</dd>
              </div>
            </dl>
          </div>
        </Reveal>

        <Reveal>
          <div className={`${CARD} h-full`}>
            <h3 className="font-display text-lg font-semibold text-white">Pointage</h3>
            {data.pointageHebdo ? (
              <>
                <p className="mt-1 font-sans text-xs text-white/50">
                  Dernière semaine validée — {fmtSemaine(data.pointageHebdo.semaine)}
                </p>
                <dl className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-sans text-sm text-white/60">Heures supplémentaires</dt>
                    <dd className="font-mono text-sm text-white">
                      {fmtHeures(data.pointageHebdo.heuresSupValidees)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-sans text-sm text-white/60">Retards cumulés</dt>
                    <dd className="font-mono text-sm text-white">
                      {fmtHeures(data.pointageHebdo.heuresRetardCumulees)} ·{" "}
                      {data.pointageHebdo.nbRetards} fois
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-sans text-sm text-white/60">Absences non justifiées</dt>
                    <dd className="font-mono text-sm text-white">
                      {fmtHeures(data.pointageHebdo.heuresAbsenceNonJustifiee)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-sans text-sm text-white/60">Taux d&apos;absence</dt>
                    <dd className="font-mono text-sm text-white">
                      {fmtTaux(data.pointageHebdo.tauxAbsence)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 font-sans text-xs text-white/40">
                  Les retards et absences non justifiées sont retenus sur votre paie, les heures
                  supplémentaires majorées de 50% (voir Mes paiements).
                </p>
              </>
            ) : (
              <p className="mt-3 font-sans text-sm text-white/50">
                Aucun pointage validé pour l&apos;instant.
              </p>
            )}
          </div>
        </Reveal>

        <Reveal>
          <div className={`${CARD} h-full`}>
            <h3 className="font-display text-lg font-semibold text-white">Production</h3>
            {data.performanceHebdo ? (
              <>
                <p className="mt-1 font-sans text-xs text-white/50">
                  Dernière semaine renseignée — {fmtSemaine(data.performanceHebdo.semaine)}
                </p>
                <dl className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-sans text-sm text-white/60">Concrétisations</dt>
                    <dd className="font-mono text-sm text-white">
                      {data.performanceHebdo.concretisations}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-sans text-sm text-white/60">Ventes</dt>
                    <dd className="font-mono text-sm text-white">
                      {data.performanceHebdo.nbVentes}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-sans text-sm text-white/60">RDV validés</dt>
                    <dd className="font-mono text-sm text-white">
                      {data.performanceHebdo.rdvValides}
                    </dd>
                  </div>
                </dl>
                {data.performanceHebdo.remarques && (
                  <p className="mt-3 border-l-2 border-accent/40 pl-3 font-sans text-xs italic text-white/60">
                    « {data.performanceHebdo.remarques} »
                  </p>
                )}
              </>
            ) : (
              <p className="mt-3 font-sans text-sm text-white/50">
                Aucune métrique de production renseignée pour l&apos;instant.
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
