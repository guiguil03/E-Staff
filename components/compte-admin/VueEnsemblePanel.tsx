"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import ComparativeBarChart from "./ComparativeBarChart";
import AlerteAdministrativePanel from "./AlerteAdministrativePanel";
import EtatFinancierProductionPanel from "./EtatFinancierProductionPanel";
import { adminHeaders } from "./adminHeaders";

interface VueEnsemble {
  talentsEnVivier: number;
  agentsEnProductionActive: number;
  vaguesEnFormation: number;
  recrutementsEnCours: number;
  apprenantsTotal: number;
  partenairesActifs: number;
  partenairesTotal: number;
  apporteursNouveauxMTD: number;
  apporteursGrowthPctMTD: number | null;
  abonnementsFolActifs: number;
}

interface VueEnsembleProduction {
  agentsActifs: number;
  missionsTotal: number;
  contratsActifs: number;
  superviseursCount: number;
}

interface PerformanceFormateur {
  matricule: string;
  prenom: string;
  nom: string;
  groupes: string[];
  moyenne: number | null;
}

interface PerformanceSuperviseur {
  matricule: string;
  prenom: string;
  nom: string;
  agentsActifs: number;
  qualityScoreMoyen: number | null;
}

function KpiCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number | string;
  note?: string;
}) {
  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-accent">{value}</p>
      {note && <p className="mt-1 font-sans text-[11px] text-white/40">{note}</p>}
    </div>
  );
}

// Vue d'ensemble du Portail RH — la vue macro : tout ce qui s'affiche ici
// est alimenté par les modules "en coulisses" (Recrutement, Académie,
// Production, Paie & Commissions, Forum, Réunions) — jamais un chiffre
// inventé pour remplir la maquette. Voir RhService.getVueEnsemble /
// getAlertesAdministratives + ProductionService pour Agents/Superviseurs/
// État financier.
export default function VueEnsemblePanel() {
  const [data, setData] = useState<VueEnsemble | "loading" | "erreur">("loading");
  const [production, setProduction] = useState<VueEnsembleProduction | "loading" | "erreur">(
    "loading"
  );
  const [performanceFormateurs, setPerformanceFormateurs] = useState<
    PerformanceFormateur[] | "loading" | "erreur"
  >("loading");
  const [performanceSuperviseurs, setPerformanceSuperviseurs] = useState<
    PerformanceSuperviseur[] | "loading" | "erreur"
  >("loading");

  useEffect(() => {
    apiGet<VueEnsemble>("/rh/vue-ensemble", adminHeaders())
      .then(setData)
      .catch(() => setData("erreur"));
    apiGet<VueEnsembleProduction>("/production/vue-ensemble", adminHeaders())
      .then(setProduction)
      .catch(() => setProduction("erreur"));
    apiGet<PerformanceFormateur[]>("/rh/performance-formateurs", adminHeaders())
      .then(setPerformanceFormateurs)
      .catch(() => setPerformanceFormateurs("erreur"));
    apiGet<PerformanceSuperviseur[]>("/production/performance-superviseurs", adminHeaders())
      .then(setPerformanceSuperviseurs)
      .catch(() => setPerformanceSuperviseurs("erreur"));
  }, []);

  if (data === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (data === "erreur")
    return <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>;

  const contratsActifs = typeof production === "object" ? production.contratsActifs : null;

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Apporteurs d'affaires"
            value={data.partenairesTotal}
            note={
              data.apporteursGrowthPctMTD !== null
                ? `+${data.apporteursGrowthPctMTD}% ce mois-ci`
                : `${data.apporteursNouveauxMTD} nouveau${data.apporteursNouveauxMTD > 1 ? "x" : ""} ce mois-ci`
            }
          />
          <KpiCard
            label="Inscriptions Académie"
            value={data.apprenantsTotal}
            note={`${data.vaguesEnFormation} vague${data.vaguesEnFormation > 1 ? "s" : ""} active${data.vaguesEnFormation > 1 ? "s" : ""}`}
          />
          <KpiCard
            label="Agents en production"
            value={data.agentsEnProductionActive}
            note={contratsActifs !== null ? `${contratsActifs} contrat${contratsActifs > 1 ? "s" : ""} actif${contratsActifs > 1 ? "s" : ""}` : undefined}
          />
          <KpiCard label="Vivier pool" value={data.talentsEnVivier} note="Candidats certifiés" />
          <KpiCard label="Abonnements FOL" value={data.abonnementsFolActifs} note="Actifs" />
          <KpiCard
            label="Clients B2B actifs"
            value={contratsActifs ?? "—"}
          />
        </div>
      </Reveal>

      <Reveal delay={20}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">
              Performance Analysis
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-sans text-sm font-semibold text-white">Formateurs</p>
                <p className="mt-1 font-mono text-[11px] text-white/40">
                  Taux de réussite moyen des groupes (/100)
                </p>
                {performanceFormateurs === "loading" && (
                  <p className="mt-4 font-sans text-xs text-white/50">Chargement...</p>
                )}
                {performanceFormateurs === "erreur" && (
                  <p className="mt-4 font-sans text-xs text-white/50">Erreur de chargement.</p>
                )}
                {Array.isArray(performanceFormateurs) && performanceFormateurs.length === 0 && (
                  <p className="mt-4 font-sans text-xs text-white/50">Aucun formateur enregistré.</p>
                )}
                {Array.isArray(performanceFormateurs) && performanceFormateurs.length > 0 && (
                  <ComparativeBarChart
                    data={performanceFormateurs.map((f) => ({
                      label: `${f.prenom} ${f.nom.charAt(0)}.`,
                      value: f.moyenne,
                    }))}
                    maxValue={100}
                  />
                )}
              </div>
              <div>
                <p className="font-sans text-sm font-semibold text-white">Superviseurs</p>
                <p className="mt-1 font-mono text-[11px] text-white/40">
                  Qualité de Service moyenne (/5)
                </p>
                {performanceSuperviseurs === "loading" && (
                  <p className="mt-4 font-sans text-xs text-white/50">Chargement...</p>
                )}
                {performanceSuperviseurs === "erreur" && (
                  <p className="mt-4 font-sans text-xs text-white/50">Erreur de chargement.</p>
                )}
                {Array.isArray(performanceSuperviseurs) && performanceSuperviseurs.length === 0 && (
                  <p className="mt-4 font-sans text-xs text-white/50">
                    Aucun superviseur enregistré.
                  </p>
                )}
                {Array.isArray(performanceSuperviseurs) && performanceSuperviseurs.length > 0 && (
                  <ComparativeBarChart
                    data={performanceSuperviseurs.map((s) => ({
                      label: `${s.prenom} ${s.nom.charAt(0)}.`,
                      value: s.qualityScoreMoyen,
                    }))}
                    maxValue={5}
                    valueSuffix="/5"
                  />
                )}
              </div>
            </div>
          </div>

          <AlerteAdministrativePanel />
        </div>
      </Reveal>

      <Reveal delay={40}>
        <EtatFinancierProductionPanel />
      </Reveal>
    </div>
  );
}
