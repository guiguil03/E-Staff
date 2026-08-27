"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { apiGet, apiPut } from "@/lib/api";
import ComparativeBarChart from "./ComparativeBarChart";
import DailyLineChart from "./DailyLineChart";
import { adminHeaders } from "./adminHeaders";

interface PerformanceAgent {
  missionId: string;
  agentNom: string;
  agentMatricule: string;
  agentEmail: string;
  superviseurNom: string | null;
  superviseurEmail: string | null;
  semaine: string | null;
  concretisations: number | null;
  tauxAbsence: number | null;
  nbRetards: number | null;
  remarques: string | null;
}

interface RapportHebdo {
  id: string;
  semaine: string;
  constat: string | null;
  analyse: string | null;
  axesAmelioration: string | null;
  superviseurNom: string | null;
  updatedAt: string;
}

interface ContratModalData {
  contratId: string;
  clientNom: string;
  description: string | null;
  dateSignature: string | null;
  dateDebut: string;
  dateFin: string | null;
  statut: string;
  clientEmail: string | null;
  objectifsJournaliers: { jour: string; tauxAtteint: number }[];
  comparatifHebdo: { semaine: string; moyenneTaux: number }[];
  performanceAgents: PerformanceAgent[];
  rapportsHebdo: RapportHebdo[];
}

type Tab = "objectifs" | "agents" | "rapports";

function fmtDayShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function todayIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
}

// Semaine ISO ("AAAA-Wss") — même calcul que ProductionService.isoWeekLabel
// côté backend, pour proposer la bonne semaine par défaut dans les
// formulaires de saisie (suivi agent / rapport superviseur).
function currentIsoWeek(): string {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "objectifs", label: "Objectifs" },
  { key: "agents", label: "Performance des agents" },
  { key: "rapports", label: "Rapports hebdomadaires" },
];

// Pop-up détail d'une carte Mission/Client — 3 onglets (objectifs
// journaliers/hebdo, performance des agents, rapports du superviseur), plus
// des raccourcis mail/réunion/casier client. Voir ProductionService.
// getContratModalData. Toute saisie (objectif, suivi agent, rapport) est
// manuelle par le superviseur : aucune synchronisation téléphonie/pointage
// n'existe dans ce produit à ce jour.
export default function ClientMissionModal({
  contratId,
  onClose,
}: {
  contratId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<ContratModalData | "loading" | "erreur">("loading");
  const [tab, setTab] = useState<Tab>("objectifs");

  function refresh() {
    apiGet<ContratModalData>(`/production/contrats/${contratId}/modal`, adminHeaders())
      .then(setData)
      .catch(() => setData("erreur"));
  }

  useEffect(() => {
    setData("loading");
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Rendu via portail dans document.body : un ancestor animé par Reveal
  // (transform CSS) crée un nouveau containing block pour position:fixed,
  // ce qui casserait l'overlay plein écran si la modale restait dans
  // l'arbre normal (voir ClientMissionCards, rendu à l'intérieur d'un
  // Reveal sur la page Production).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded border border-white/10 bg-obsidianCard p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {data === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
        {data === "erreur" && (
          <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}

        {typeof data === "object" && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="font-display text-lg font-semibold text-white">{data.clientNom}</p>
                {data.description && (
                  <p className="mt-0.5 font-sans text-sm text-white/60">{data.description}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {data.clientEmail ? (
                  <a
                    href={`mailto:${data.clientEmail}`}
                    className="rounded border border-white/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/70 hover:border-accent hover:text-accent"
                  >
                    Envoyer un mail
                  </a>
                ) : (
                  <span
                    title="Aucun email enregistré pour ce client"
                    className="rounded border border-white/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/30"
                  >
                    Envoyer un mail
                  </span>
                )}
                <Link
                  href="/compte/admin/reunions"
                  className="rounded border border-white/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/70 hover:border-accent hover:text-accent"
                >
                  Planifier une réunion
                </Link>
                <Link
                  href={`/compte/admin/contrats/${data.contratId}`}
                  className="rounded border border-white/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/70 hover:border-accent hover:text-accent"
                >
                  Casier client
                </Link>
                <button
                  onClick={onClose}
                  className="rounded border border-white/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/50 hover:border-white/30 hover:text-white"
                >
                  Fermer
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-1.5 border-b border-white/10">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                    tab === t.key
                      ? "border-b-2 border-accent text-accent"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {tab === "objectifs" && (
                <ObjectifsTab contratId={data.contratId} data={data} onSaved={refresh} />
              )}
              {tab === "agents" && <AgentsTab data={data} onSaved={refresh} />}
              {tab === "rapports" && (
                <RapportsTab contratId={data.contratId} data={data} onSaved={refresh} />
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function ObjectifsTab({
  contratId,
  data,
  onSaved,
}: {
  contratId: string;
  data: ContratModalData;
  onSaved: () => void;
}) {
  const [taux, setTaux] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function save() {
    if (taux === "") return;
    setStatus("saving");
    try {
      await apiPut(
        `/production/contrats/${contratId}/objectifs-journaliers`,
        { jour: todayIso(), tauxAtteint: Number(taux) },
        adminHeaders()
      );
      setTaux("");
      setStatus("idle");
      onSaved();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-white/50">
          Objectif atteint — par jour
        </p>
        {data.objectifsJournaliers.length === 0 ? (
          <p className="mt-3 font-sans text-xs text-white/50">
            Aucune saisie pour l&apos;instant.
          </p>
        ) : (
          <DailyLineChart
            data={data.objectifsJournaliers.map((o) => ({
              label: fmtDayShort(o.jour),
              value: o.tauxAtteint,
            }))}
          />
        )}
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">
              Objectif du jour (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={taux}
              onChange={(e) => setTaux(e.target.value)}
              className="mt-1 w-28 rounded border border-white/20 bg-obsidian px-2.5 py-1.5 font-sans text-sm text-white outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={save}
            disabled={status === "saving" || taux === ""}
            className="rounded border border-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
          >
            {status === "saving" ? "Enregistrement..." : "Enregistrer aujourd'hui"}
          </button>
          {status === "error" && (
            <span className="font-mono text-[11px] text-accent">Erreur.</span>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-white/50">
          Comparatif hebdomadaire
        </p>
        {data.comparatifHebdo.length === 0 ? (
          <p className="mt-3 font-sans text-xs text-white/50">
            Pas assez de données pour un comparatif hebdomadaire.
          </p>
        ) : (
          <ComparativeBarChart
            data={data.comparatifHebdo.map((s) => ({ label: s.semaine.replace(/^\d+-/, ""), value: s.moyenneTaux }))}
            maxValue={100}
            valueSuffix="%"
          />
        )}
      </div>
    </div>
  );
}

function AgentsTab({ data, onSaved }: { data: ContratModalData; onSaved: () => void }) {
  return (
    <div className="overflow-x-auto">
      {data.performanceAgents.length === 0 ? (
        <p className="font-sans text-xs text-white/50">Aucun agent actif sur ce contrat.</p>
      ) : (
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
              <th className="py-2 pr-3">Agent</th>
              <th className="py-2 pr-3">Superviseur</th>
              <th className="py-2 pr-3">Concrétisations</th>
              <th className="py-2 pr-3">Absences %</th>
              <th className="py-2 pr-3">Retards</th>
              <th className="py-2 pr-3">Remarques</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.performanceAgents.map((a) => (
              <AgentRow key={a.missionId} agent={a} onSaved={onSaved} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AgentRow({ agent, onSaved }: { agent: PerformanceAgent; onSaved: () => void }) {
  const semaine = agent.semaine ?? currentIsoWeek();
  const [concretisations, setConcretisations] = useState(
    agent.concretisations !== null ? String(agent.concretisations) : ""
  );
  const [tauxAbsence, setTauxAbsence] = useState(
    agent.tauxAbsence !== null ? String(agent.tauxAbsence) : ""
  );
  const [nbRetards, setNbRetards] = useState(agent.nbRetards !== null ? String(agent.nbRetards) : "");
  const [remarques, setRemarques] = useState(agent.remarques ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function save() {
    setStatus("saving");
    try {
      await apiPut(
        `/production/missions/${agent.missionId}/suivi-hebdo`,
        {
          semaine,
          concretisations: concretisations === "" ? 0 : Number(concretisations),
          tauxAbsence: tauxAbsence === "" ? null : Number(tauxAbsence),
          nbRetards: nbRetards === "" ? 0 : Number(nbRetards),
          remarques: remarques.trim() || null,
        },
        adminHeaders()
      );
      setStatus("idle");
      onSaved();
    } catch {
      setStatus("error");
    }
  }

  return (
    <tr className="border-b border-white/5 align-top font-sans text-xs text-white/80">
      <td className="py-2 pr-3">
        <span className="block text-white">{agent.agentNom}</span>
        <span className="block font-mono text-[10px] text-white/40">
          {agent.agentMatricule} · {semaine}
        </span>
        <a
          href={`mailto:${agent.agentEmail}`}
          className="mt-0.5 block font-mono text-[10px] text-white/40 hover:text-accent"
        >
          Envoyer un mail
        </a>
      </td>
      <td className="py-2 pr-3">
        {agent.superviseurNom ?? "—"}
        {agent.superviseurEmail && (
          <a
            href={`mailto:${agent.superviseurEmail}`}
            className="mt-0.5 block font-mono text-[10px] text-white/40 hover:text-accent"
          >
            Envoyer un mail
          </a>
        )}
      </td>
      <td className="py-2 pr-3">
        <input
          type="number"
          value={concretisations}
          onChange={(e) => setConcretisations(e.target.value)}
          className="w-20 rounded border border-white/20 bg-obsidian px-2 py-1 text-xs text-white outline-none focus:border-accent"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          type="number"
          value={tauxAbsence}
          onChange={(e) => setTauxAbsence(e.target.value)}
          className="w-20 rounded border border-white/20 bg-obsidian px-2 py-1 text-xs text-white outline-none focus:border-accent"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          type="number"
          value={nbRetards}
          onChange={(e) => setNbRetards(e.target.value)}
          className="w-16 rounded border border-white/20 bg-obsidian px-2 py-1 text-xs text-white outline-none focus:border-accent"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          value={remarques}
          onChange={(e) => setRemarques(e.target.value)}
          placeholder="—"
          className="w-40 rounded border border-white/20 bg-obsidian px-2 py-1 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent"
        />
      </td>
      <td className="py-2 pr-3">
        <button
          onClick={save}
          disabled={status === "saving"}
          className="rounded border border-accent px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
        >
          {status === "saving" ? "..." : "OK"}
        </button>
        {status === "error" && <p className="mt-1 font-mono text-[10px] text-accent">Erreur.</p>}
      </td>
    </tr>
  );
}

function RapportsTab({
  contratId,
  data,
  onSaved,
}: {
  contratId: string;
  data: ContratModalData;
  onSaved: () => void;
}) {
  const semaineActuelle = currentIsoWeek();
  const existant = data.rapportsHebdo.find((r) => r.semaine === semaineActuelle) ?? null;

  const [semaine, setSemaine] = useState(semaineActuelle);
  const [constat, setConstat] = useState(existant?.constat ?? "");
  const [analyse, setAnalyse] = useState(existant?.analyse ?? "");
  const [axes, setAxes] = useState(existant?.axesAmelioration ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function save() {
    setStatus("saving");
    try {
      await apiPut(
        `/production/contrats/${contratId}/rapports-hebdo`,
        { semaine, constat: constat.trim() || null, analyse: analyse.trim() || null, axesAmelioration: axes.trim() || null },
        adminHeaders()
      );
      setStatus("idle");
      onSaved();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">
            Semaine
          </label>
          <input
            value={semaine}
            onChange={(e) => setSemaine(e.target.value)}
            className="w-28 rounded border border-white/20 bg-obsidian px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent"
          />
        </div>

        <div className="mt-3 grid gap-3">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">
              Constat
            </label>
            <textarea
              value={constat}
              onChange={(e) => setConstat(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">
              Analyse
            </label>
            <textarea
              value={analyse}
              onChange={(e) => setAnalyse(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">
              Axes d&apos;amélioration
            </label>
            <textarea
              value={axes}
              onChange={(e) => setAxes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={save}
            disabled={status === "saving"}
            className="rounded border border-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
          >
            {status === "saving" ? "Enregistrement..." : "Enregistrer le rapport"}
          </button>
          {status === "error" && (
            <span className="font-mono text-[11px] text-accent">Erreur.</span>
          )}
        </div>
      </div>

      {data.rapportsHebdo.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-white/50">
            Historique
          </p>
          <div className="mt-3 space-y-2">
            {data.rapportsHebdo.map((r) => (
              <div key={r.id} className="rounded border border-white/10 bg-obsidian p-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
                  {r.semaine}
                  {r.superviseurNom && <span className="text-white/40"> — {r.superviseurNom}</span>}
                </p>
                {r.constat && (
                  <p className="mt-1 font-sans text-xs text-white/70">
                    <span className="text-white/40">Constat : </span>
                    {r.constat}
                  </p>
                )}
                {r.analyse && (
                  <p className="mt-1 font-sans text-xs text-white/70">
                    <span className="text-white/40">Analyse : </span>
                    {r.analyse}
                  </p>
                )}
                {r.axesAmelioration && (
                  <p className="mt-1 font-sans text-xs text-white/70">
                    <span className="text-white/40">Axes d&apos;amélioration : </span>
                    {r.axesAmelioration}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
