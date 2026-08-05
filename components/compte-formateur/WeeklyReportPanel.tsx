"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { WEEKLY_REPORT_STATS } from "./exampleData";

interface WeeklyReportPanelProps {
  onClose: () => void;
}

const STATS_ROWS: { label: string; value: string }[] = [
  { label: "Moyenne générale de la cohorte", value: `${WEEKLY_REPORT_STATS.moyenneGenerale}/100` },
  {
    label: "Évolution vs semaine N-1",
    value: `${WEEKLY_REPORT_STATS.evolutionVsSemaineN1 >= 0 ? "+" : ""}${WEEKLY_REPORT_STATS.evolutionVsSemaineN1} pts`,
  },
  { label: "Groupes en baisse de tendance", value: `${WEEKLY_REPORT_STATS.groupesEnBaisse}` },
  { label: "Taux de présence global", value: `${WEEKLY_REPORT_STATS.tauxPresenceGlobal}%` },
  { label: "Travaux corrigés cette semaine", value: `${WEEKLY_REPORT_STATS.rendusCorriges}` },
  { label: "Alertes de décrochage traitées", value: `${WEEKLY_REPORT_STATS.alertesDecrochageTraitees}` },
  { label: "Nouveaux apprenants dans le Vivier C1", value: `${WEEKLY_REPORT_STATS.nouveauxVivierC1}` },
];

// Rapport Hebdomadaire — chiffres pré-remplis (données de la semaine) +
// 3 blocs qualitatifs obligatoires demandés par la cliente. Pas de vrai
// export PDF/Excel ni d'envoi à la direction pour l'instant — le contenu
// qualitatif reste consultable ici, honnêtement présenté comme non transmis.
export default function WeeklyReportPanel({ onClose }: WeeklyReportPanelProps) {
  const [constat, setConstat] = useState("");
  const [analyse, setAnalyse] = useState("");
  const [axes, setAxes] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Reveal>
      <div className="rounded border border-accent/30 bg-obsidianCard p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-white">
            Rapport Hebdomadaire Formateur
          </h3>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent"
          >
            Fermer ✕
          </button>
        </div>

        <div className="mt-4 grid gap-2 rounded border border-white/10 bg-obsidian p-4 sm:grid-cols-2">
          {STATS_ROWS.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-2">
              <p className="font-sans text-xs text-white/60">{row.label}</p>
              <p className="font-mono text-sm text-accent">{row.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="font-sans text-sm font-semibold text-white" htmlFor="report-constat">
              1. Le Constat — où en sommes-nous ?
            </label>
            <textarea
              id="report-constat"
              rows={3}
              value={constat}
              onChange={(e) => setConstat(e.target.value)}
              placeholder="Ex. Difficultés récurrentes constatées sur l'expression orale formelle du Groupe C..."
              className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="font-sans text-sm font-semibold text-white" htmlFor="report-analyse">
              2. L&apos;Analyse — pourquoi en sommes-nous là ?
            </label>
            <textarea
              id="report-analyse"
              rows={3}
              value={analyse}
              onChange={(e) => setAnalyse(e.target.value)}
              placeholder="Ex. La baisse s'explique par un décrochage sur les ateliers de posture non-verbale de S-3..."
              className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="font-sans text-sm font-semibold text-white" htmlFor="report-axes">
              3. Les Axes d&apos;amélioration — plan d&apos;action pour J+1
            </label>
            <textarea
              id="report-axes"
              rows={3}
              value={axes}
              onChange={(e) => setAxes(e.target.value)}
              placeholder="Ex. Session de remédiation de 30 min axée sur la diction pour le Groupe C dès lundi..."
              className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button
            variant="dark"
            onClick={() => setSent(true)}
            disabled={!constat.trim() || !analyse.trim() || !axes.trim()}
          >
            Valider &amp; Envoyer le Rapport
          </Button>
          {sent && (
            <p className="font-sans text-xs text-white/50">
              Export PDF/Excel et envoi automatique à la direction — fonctionnalité en cours de
              construction. Votre rapport reste visible ici pour l&apos;instant.
            </p>
          )}
        </div>
      </div>
    </Reveal>
  );
}
