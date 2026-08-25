"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import ComparativeBarChart from "./ComparativeBarChart";
import { adminHeaders } from "./adminHeaders";

interface VueEnsemble {
  talentsEnVivier: number;
  agentsEnProductionActive: number;
  vaguesEnFormation: number;
  recrutementsEnCours: number;
  apprenantsTotal: number;
  partenairesActifs: number;
  partenairesTotal: number;
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

// Vue d'ensemble du Portail RH — KPIs réels calculés côté back (voir
// RhService.getVueEnsemble + ProductionService pour Agents/Superviseurs
// depuis le module Production, phase 4, 2026-08-26) — jamais de chiffre
// inventé : un "0" réel (aucune donnée pour l'instant) plutôt qu'un
// "bientôt disponible" une fois que la donnée existe réellement en base.
export default function VueEnsemblePanel() {
  const [data, setData] = useState<VueEnsemble | "loading" | "erreur">("loading");
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

  return (
    <div className="space-y-8">
      <Reveal>
        <h2 className="font-display text-lg font-semibold text-white">
          Vue d&apos;ensemble des talents &amp; vagues
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Talents en vivier (C1)" value={data.talentsEnVivier} />
          <KpiCard label="Agents en production active" value={data.agentsEnProductionActive} />
          <KpiCard label="Vagues de production en formation" value={data.vaguesEnFormation} />
          <KpiCard label="Recrutements en cours" value={data.recrutementsEnCours} />
        </div>
      </Reveal>

      <Reveal delay={40}>
        <h2 className="font-display text-lg font-semibold text-white">
          Statistiques comparatives globales
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded border border-white/10 bg-obsidianCard p-5">
            <p className="font-sans text-sm font-semibold text-white">Performance des formateurs</p>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Moyenne des groupes encadrés (/100)
            </p>
            {performanceFormateurs === "loading" && (
              <p className="mt-4 font-sans text-xs text-white/50">Chargement...</p>
            )}
            {performanceFormateurs === "erreur" && (
              <p className="mt-4 font-sans text-xs text-white/50">Erreur de chargement.</p>
            )}
            {Array.isArray(performanceFormateurs) && performanceFormateurs.length === 0 && (
              <p className="mt-4 font-sans text-xs text-white/50">
                Aucun formateur enregistré pour l&apos;instant.
              </p>
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
            <a
              href="/compte/admin/academie"
              className="mt-3 inline-block font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
            >
              Gérer les formateurs →
            </a>
          </div>
          <div className="rounded border border-white/10 bg-obsidianCard p-5">
            <p className="font-sans text-sm font-semibold text-white">Performance des superviseurs</p>
            <p className="mt-1 font-mono text-[11px] text-white/40">Qualité de Service moyenne (/5)</p>
            {performanceSuperviseurs === "loading" && (
              <p className="mt-4 font-sans text-xs text-white/50">Chargement...</p>
            )}
            {performanceSuperviseurs === "erreur" && (
              <p className="mt-4 font-sans text-xs text-white/50">Erreur de chargement.</p>
            )}
            {Array.isArray(performanceSuperviseurs) && performanceSuperviseurs.length === 0 && (
              <p className="mt-4 font-sans text-xs text-white/50">
                Aucun superviseur enregistré pour l&apos;instant.
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
            <a
              href="/compte/admin/production"
              className="mt-3 inline-block font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
            >
              Gérer la Production →
            </a>
          </div>
          <div className="rounded border border-white/10 bg-obsidianCard p-5">
            <p className="font-sans text-sm font-semibold text-white">Performance des partenaires</p>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Volumes d&apos;intégration &amp; statut
            </p>
            <div className="mt-4 flex items-end gap-3">
              <span className="font-display text-2xl font-bold text-accent">
                {data.partenairesActifs}
              </span>
              <span className="font-sans text-xs text-white/50">
                actif{data.partenairesActifs > 1 ? "s" : ""} sur {data.partenairesTotal} au total
              </span>
            </div>
            <a
              href="/compte/admin/partenaires"
              className="mt-3 inline-block font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
            >
              Voir le détail →
            </a>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
