"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface WeeklyReportPanelProps {
  onClose: () => void;
}

interface RapportHebdoApi {
  moyenneGenerale: number | null;
  tauxPresenceGlobal: number | null;
  rendusCorriges7j: number;
  vivierC1Total: number;
  alertesDecrochageActuelles: number;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function statsRows(stats: RapportHebdoApi): { label: string; value: string }[] {
  return [
    { label: "Moyenne générale de la cohorte", value: `${stats.moyenneGenerale ?? "—"}/100` },
    { label: "Taux de présence global", value: `${stats.tauxPresenceGlobal ?? "—"}%` },
    { label: "Travaux corrigés cette semaine", value: `${stats.rendusCorriges7j}` },
    { label: "Apprenants en alerte décrochage", value: `${stats.alertesDecrochageActuelles}` },
    { label: "Apprenants au niveau C1 (Vivier)", value: `${stats.vivierC1Total}` },
  ];
}

// Rapport Hebdomadaire — chiffres branchés sur les vraies données (table
// Notation/Presence, voir /cockpit/rapport-hebdo) depuis 2026-08-24, +
// 3 blocs qualitatifs obligatoires demandés par la cliente. La validation
// persiste le bilan (POST /cockpit/bilan-hebdo, voir BilanFormateur dans
// schema.prisma) et le rend visible dans le Casier Formateur côté RH —
// toujours pas d'export PDF/Excel ni d'e-mail automatique pour l'instant.
// Deux chiffres de l'ancienne maquette ("Évolution vs semaine N-1",
// "Groupes en baisse de tendance") ont été retirés : ils nécessitent un
// historique semaine par semaine qui n'existe pas encore côté backend
// (aucune table de snapshot) — à construire séparément si besoin.
export default function WeeklyReportPanel({ onClose }: WeeklyReportPanelProps) {
  const [stats, setStats] = useState<RapportHebdoApi | "loading" | "erreur">("loading");
  const [constat, setConstat] = useState("");
  const [analyse, setAnalyse] = useState("");
  const [axes, setAxes] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setSending(true);
    setError(null);
    apiPostAuthed("/cockpit/bilan-hebdo", { constat, analyse, axes }, formateurHeaders())
      .then(() => setSent(true))
      .catch(() => setError("Échec de l'envoi du bilan. Réessayez."))
      .finally(() => setSending(false));
  }

  useEffect(() => {
    apiGet<RapportHebdoApi>("/cockpit/rapport-hebdo", formateurHeaders())
      .then(setStats)
      .catch(() => setStats("erreur"));
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
              Bilan enregistré — visible dans votre Casier côté RH. Pas encore d&apos;export
              PDF/Excel ni d&apos;e-mail automatique.
            </p>
          )}
          {error && <p className="font-sans text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </Reveal>
  );
}
