"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

const API_URL = (process.env.NEXT_PUBLIC_API_URL_Dev ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

interface WeeklyReportPanelProps {
  onClose: () => void;
}

interface RapportHebdoApi {
  moyenneGenerale: number | null;
  tauxPresenceGlobal: number | null;
  rendusCorriges7j: number;
  vivierC1Total: number;
  alertesDecrochageActuelles: number;
  evolutionVsSemainePrecedente: { moyenneGenerale: number | null; tauxPresenceGlobal: number | null } | null;
}

interface BilanHebdo {
  id: string;
  createdAt: string;
  constat: string;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function evolutionLabel(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return "";
  if (delta === 0) return " (= vs semaine précédente)";
  return ` (${delta > 0 ? "▲ +" : "▼ "}${delta} vs semaine précédente)`;
}

function statsRows(stats: RapportHebdoApi): { label: string; value: string }[] {
  const evolution = stats.evolutionVsSemainePrecedente;
  return [
    {
      label: "Moyenne générale de la cohorte",
      value: `${stats.moyenneGenerale ?? "—"}/100${evolutionLabel(evolution?.moyenneGenerale)}`,
    },
    {
      label: "Taux de présence global",
      value: `${stats.tauxPresenceGlobal ?? "—"}%${evolutionLabel(evolution?.tauxPresenceGlobal)}`,
    },
    { label: "Travaux corrigés cette semaine", value: `${stats.rendusCorriges7j}` },
    { label: "Apprenants en alerte décrochage", value: `${stats.alertesDecrochageActuelles}` },
    { label: "Apprenants au niveau C1 (Vivier)", value: `${stats.vivierC1Total}` },
  ];
}

// Rapport Hebdomadaire — chiffres branchés sur les vraies données (table
// Notation/Presence, voir /cockpit/rapport-hebdo) depuis 2026-08-24, +
// 3 blocs qualitatifs obligatoires demandés par la cliente. La validation
// persiste le bilan (POST /cockpit/bilan-hebdo, voir BilanFormateur dans
// schema.prisma), le rend visible dans le Casier Formateur côté RH et
// notifie automatiquement la RH par e-mail. "Évolution vs semaine N-1"
// (ci-dessous) compare aux chiffres figés du dernier bilan validé par ce
// formateur — "Groupes en baisse de tendance" reste hors scope : il
// demanderait un vrai pipeline d'agrégation par groupe qui n'existe pas
// (getRapportHebdo reste volontairement académie entière).
export default function WeeklyReportPanel({ onClose }: WeeklyReportPanelProps) {
  const [stats, setStats] = useState<RapportHebdoApi | "loading" | "erreur">("loading");
  const [historique, setHistorique] = useState<BilanHebdo[] | "loading" | "erreur">("loading");
  const [constat, setConstat] = useState("");
  const [analyse, setAnalyse] = useState("");
  const [axes, setAxes] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refreshStats() {
    apiGet<RapportHebdoApi>("/cockpit/rapport-hebdo", formateurHeaders())
      .then(setStats)
      .catch(() => setStats("erreur"));
  }

  function refreshHistorique() {
    apiGet<BilanHebdo[]>("/cockpit/bilans-hebdo", formateurHeaders())
      .then(setHistorique)
      .catch(() => setHistorique("erreur"));
  }

  function handleSubmit() {
    setSending(true);
    setError(null);
    apiPostAuthed("/cockpit/bilan-hebdo", { constat, analyse, axes }, formateurHeaders())
      .then(() => {
        setSent(true);
        refreshHistorique();
      })
      .catch(() => setError("Échec de l'envoi du bilan. Réessayez."))
      .finally(() => setSending(false));
  }

  useEffect(() => {
    refreshStats();
    refreshHistorique();
  }, []);

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
          {stats === "loading" && (
            <p className="font-sans text-xs text-white/50 sm:col-span-2">Chargement...</p>
          )}
          {stats === "erreur" && (
            <p className="font-sans text-xs text-white/50 sm:col-span-2">
              Impossible de charger les chiffres de la semaine.
            </p>
          )}
          {stats !== "loading" &&
            stats !== "erreur" &&
            statsRows(stats).map((row) => (
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
            onClick={handleSubmit}
            disabled={sending || sent || !constat.trim() || !analyse.trim() || !axes.trim()}
          >
            {sending ? "Envoi..." : "Valider & Envoyer le Rapport"}
          </Button>
          {sent && (
            <p className="font-sans text-xs text-white/50">
              Bilan enregistré — visible dans votre Casier côté RH, qui a été notifiée par
              e-mail. Téléchargez-le en PDF ci-dessous.
            </p>
          )}
          {error && <p className="font-sans text-xs text-red-400">{error}</p>}
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="font-sans text-sm font-semibold text-white">Historique de vos bilans</p>
          {historique === "loading" && (
            <p className="mt-2 font-sans text-xs text-white/50">Chargement...</p>
          )}
          {historique === "erreur" && (
            <p className="mt-2 font-sans text-xs text-white/50">Impossible de charger l&apos;historique.</p>
          )}
          {Array.isArray(historique) && historique.length === 0 && (
            <p className="mt-2 font-sans text-xs text-white/50">Aucun bilan validé pour l&apos;instant.</p>
          )}
          {Array.isArray(historique) && historique.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {historique.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] text-white/60">
                    {new Date(b.createdAt).toLocaleDateString("fr-FR")} — {b.constat.slice(0, 60)}
                    {b.constat.length > 60 ? "…" : ""}
                  </p>
                  <a
                    href={`${API_URL}/cockpit/bilan-hebdo/${b.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-accent hover:underline"
                  >
                    Télécharger PDF
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Reveal>
  );
}
