"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import ComparativeBarChart from "./ComparativeBarChart";
import { adminHeaders } from "./adminHeaders";

interface VueEnsembleProduction {
  agentsActifs: number;
  missionsTotal: number;
  contratsActifs: number;
  superviseursCount: number;
}

interface PerformanceSuperviseur {
  matricule: string;
  prenom: string;
  nom: string;
  agentsActifs: number;
  qualityScoreMoyen: number | null;
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-accent">{value}</p>
    </div>
  );
}

// Vue d'ensemble Production — KPIs réels (voir ProductionService) + le
// comparatif de performance des superviseurs (QS moyen des agents sous leur
// supervision), qui remplace le "Bientôt disponible" affiché avant le
// module Production sur la Vue d'ensemble générale du Portail RH.
export default function ProductionVueEnsemble() {
  const [data, setData] = useState<VueEnsembleProduction | "loading" | "erreur">("loading");
  const [performance, setPerformance] = useState<PerformanceSuperviseur[] | "loading" | "erreur">(
    "loading"
  );

  useEffect(() => {
    apiGet<VueEnsembleProduction>("/production/vue-ensemble", adminHeaders())
      .then(setData)
      .catch(() => setData("erreur"));
    apiGet<PerformanceSuperviseur[]>("/production/performance-superviseurs", adminHeaders())
      .then(setPerformance)
      .catch(() => setPerformance("erreur"));
  }, []);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
          {data === "erreur" && (
            <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>
          )}
          {typeof data === "object" && (
            <>
              <KpiCard label="Agents en production active" value={data.agentsActifs} />
              <KpiCard label="Missions au total (historique inclus)" value={data.missionsTotal} />
              <KpiCard label="Contrats B2B actifs" value={data.contratsActifs} />
              <KpiCard label="Superviseurs" value={data.superviseursCount} />
            </>
          )}
        </div>
      </Reveal>

      <Reveal delay={40}>
        <div className="rounded border border-white/10 bg-obsidianCard p-5">
          <p className="font-sans text-sm font-semibold text-white">Performance des superviseurs</p>
          <p className="mt-1 font-mono text-[11px] text-white/40">
            Qualité de Service moyenne des agents sous supervision
          </p>
          {performance === "loading" && (
            <p className="mt-4 font-sans text-xs text-white/50">Chargement...</p>
          )}
          {performance === "erreur" && (
            <p className="mt-4 font-sans text-xs text-white/50">Erreur de chargement.</p>
          )}
          {Array.isArray(performance) && performance.length === 0 && (
            <p className="mt-4 font-sans text-xs text-white/50">Aucun superviseur enregistré.</p>
          )}
          {Array.isArray(performance) && performance.length > 0 && (
            <ComparativeBarChart
              data={performance.map((s) => ({
                label: `${s.prenom} ${s.nom.charAt(0)}.`,
                value: s.qualityScoreMoyen,
              }))}
              maxValue={5}
              valueSuffix="/5"
            />
          )}
        </div>
      </Reveal>
    </div>
  );
}
