"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import ComparativeBarChart from "./ComparativeBarChart";
import ClientMissionCards from "./ClientMissionCards";
import { adminHeaders } from "./adminHeaders";

interface PerformanceSuperviseur {
  matricule: string;
  prenom: string;
  nom: string;
  agentsActifs: number;
  qualityScoreMoyen: number | null;
}

// Vue d'ensemble Production — une carte par contrat/mission active (voir
// ClientMissionCards, qui remplace les 4 cartes KPI génériques d'origine)
// + le comparatif de performance des superviseurs (QS moyen des agents
// sous leur supervision).
export default function ProductionVueEnsemble() {
  const [performance, setPerformance] = useState<PerformanceSuperviseur[] | "loading" | "erreur">(
    "loading"
  );

  useEffect(() => {
    apiGet<PerformanceSuperviseur[]>("/production/performance-superviseurs", adminHeaders())
      .then(setPerformance)
      .catch(() => setPerformance("erreur"));
  }, []);

  return (
    <div className="space-y-6">
      <Reveal>
        <ClientMissionCards />
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
