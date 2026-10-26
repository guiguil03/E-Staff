"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface ApprenantDisponible {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  groupeLabel: string;
}

interface AgentDisponible {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  poste: string | null;
  statut: string;
}

interface Contrat {
  id: string;
  clientNom: string;
  statut: string;
}

interface Superviseur {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
}

interface Mission {
  id: string;
  role: string;
  dateDebut: string;
  dateFin: string | null;
  qualityScore: number | null;
  objectifJournalier: number | null;
  objectifHebdo: number | null;
  // Titulaire : un agent (compte de production, cas normal depuis le
  // 2026-10-22) ou un apprenant (missions créées avant ce compte).
  agent: { matricule: string; prenom: string; nom: string } | null;
  apprenant: { matricule: string; prenom: string; nom: string } | null;
  contrat: { clientNom: string };
  superviseur: { prenom: string; nom: string } | null;
}

function titulaire(m: Mission): { nom: string; matricule: string; type: string } {
  if (m.agent) {
    return {
      nom: `${m.agent.prenom} ${m.agent.nom}`,
      matricule: m.agent.matricule,
      type: "Agent",
    };
  }
  if (m.apprenant) {
    return {
      nom: `${m.apprenant.prenom} ${m.apprenant.nom}`,
      matricule: m.apprenant.matricule,
      type: "Apprenant",
    };
  }
  return { nom: "—", matricule: "—", type: "" };
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

const emptyForm = {
  // "agent" (compte de production) ou "apprenant" (diplômé pas encore doté
  // d'un compte agent) — voir ProductionService.createMission, qui exige
  // exactement l'un des deux.
  titulaireType: "agent" as "agent" | "apprenant",
  agentId: "",
  apprenantId: "",
  contratId: "",
  superviseurId: "",
  role: "",
  objectifJournalier: "",
  objectifHebdo: "",
};

const selectClass =
  "mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent";
const fieldLabelClass = "block font-mono text-xs uppercase tracking-widest text-white/50";

// Agents en production — assignation d'un apprenant diplômé (voir
// listApprenantsDisponibles, filtré aux apprenants sans mission active) à un
// contrat B2B, sous un superviseur, avec un rôle. Une mission active
// (dateFin=null) = l'agent est actuellement staffé chez ce client.
export default function MissionsPanel() {
  const [missions, setMissions] = useState<Mission[] | "loading" | "erreur">("loading");
  const [apprenants, setApprenants] = useState<ApprenantDisponible[]>([]);
  const [agents, setAgents] = useState<AgentDisponible[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [superviseurs, setSuperviseurs] = useState<Superviseur[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [qsDrafts, setQsDrafts] = useState<Record<string, string>>({});

  function refresh() {
    setMissions("loading");
    apiGet<Mission[]>("/production/missions", adminHeaders())
      .then((list) => {
        setMissions(list);
        setQsDrafts(Object.fromEntries(list.map((m) => [m.id, m.qualityScore?.toString() ?? ""])));
      })
      .catch(() => setMissions("erreur"));
    apiGet<ApprenantDisponible[]>("/production/apprenants-disponibles", adminHeaders())
      .then(setApprenants)
      .catch(() => {});
    apiGet<AgentDisponible[]>("/production/agents-disponibles", adminHeaders())
      .then(setAgents)
      .catch(() => {});
    apiGet<Contrat[]>("/production/contrats", adminHeaders())
      .then((list) => setContrats(list.filter((c) => c.statut === "actif")))
      .catch(() => {});
    apiGet<Superviseur[]>("/production/superviseurs", adminHeaders())
      .then(setSuperviseurs)
      .catch(() => {});
  }

  useEffect(refresh, []);

  const titulaireChoisi = form.titulaireType === "agent" ? form.agentId : form.apprenantId;
  const vivier = form.titulaireType === "agent" ? agents.length : apprenants.length;

  async function create() {
    if (!titulaireChoisi || !form.contratId || !form.role.trim()) return;
    setStatus("saving");
    setError(null);
    try {
      await apiPostAuthed(
        "/production/missions",
        {
          agentId: form.titulaireType === "agent" ? form.agentId : undefined,
          apprenantId: form.titulaireType === "apprenant" ? form.apprenantId : undefined,
          contratId: form.contratId,
          superviseurId: form.superviseurId || undefined,
          role: form.role.trim(),
          dateDebut: new Date().toISOString(),
          objectifJournalier: form.objectifJournalier
            ? Number(form.objectifJournalier)
            : undefined,
          objectifHebdo: form.objectifHebdo ? Number(form.objectifHebdo) : undefined,
        },
        adminHeaders()
      );
      setForm(emptyForm);
      setOpen(false);
      setStatus("idle");
      refresh();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Erreur lors de l'assignation.");
    }
  }

  async function cloturer(id: string) {
    if (!window.confirm("Clôturer cette mission ?")) return;
    await apiPut(
      `/production/missions/${id}`,
      { dateFin: new Date().toISOString() },
      adminHeaders()
    );
    refresh();
  }

  async function saveQs(id: string) {
    const value = qsDrafts[id]?.trim();
    if (value === "" || value === undefined) return;
    const num = Number(value);
    if (Number.isNaN(num)) return;
    await apiPut(`/production/missions/${id}`, { qualityScore: num }, adminHeaders());
    refresh();
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-white">
            Agents en production
          </h3>
          <button
            onClick={() => setOpen((o) => !o)}
            className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
          >
            {open ? "Fermer" : "+ Assigner une mission"}
          </button>
        </div>

        {open && (
          <div className="mt-4 rounded border border-white/10 bg-obsidian p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className={fieldLabelClass}>Titulaire</span>
              {(["agent", "apprenant"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 font-sans text-sm text-white/70">
                  <input
                    type="radio"
                    name="titulaire-type"
                    value={type}
                    checked={form.titulaireType === type}
                    onChange={() => setForm((f) => ({ ...f, titulaireType: type }))}
                    className="accent-accent"
                  />
                  {type === "agent" ? "Agent de production" : "Apprenant diplômé"}
                </label>
              ))}
            </div>
            <p className="mt-2 font-sans text-xs text-white/40">
              Les agents ont leur propre compte (Portail &gt; Agents de production) et voient leurs
              objectifs dans leur espace. L&apos;option « apprenant » reste là pour les diplômés
              placés avant la création des comptes agents.
            </p>

            {vivier === 0 ? (
              <p className="mt-3 font-sans text-xs text-white/50">
                {form.titulaireType === "agent"
                  ? "Aucun agent disponible (tous déjà en mission, ou aucun compte créé)."
                  : "Aucun apprenant disponible actuellement (tous en formation ou déjà en mission)."}
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={fieldLabelClass}>
                    {form.titulaireType === "agent" ? "Agent" : "Apprenant"}
                  </label>
                  {form.titulaireType === "agent" ? (
                    <select
                      value={form.agentId}
                      onChange={(e) => setForm((f) => ({ ...f, agentId: e.target.value }))}
                      className={selectClass}
                    >
                      <option value="">— Choisir —</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.prenom} {a.nom} ({a.matricule}
                          {a.poste ? ` — ${a.poste}` : ""})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={form.apprenantId}
                      onChange={(e) => setForm((f) => ({ ...f, apprenantId: e.target.value }))}
                      className={selectClass}
                    >
                      <option value="">— Choisir —</option>
                      {apprenants.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.prenom} {a.nom} ({a.matricule} — {a.groupeLabel})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className={fieldLabelClass}>Contrat</label>
                  <select
                    value={form.contratId}
                    onChange={(e) => setForm((f) => ({ ...f, contratId: e.target.value }))}
                    className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                  >
                    <option value="">— Choisir —</option>
                    {contrats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.clientNom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabelClass}>Superviseur</label>
                  <select
                    value={form.superviseurId}
                    onChange={(e) => setForm((f) => ({ ...f, superviseurId: e.target.value }))}
                    className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                  >
                    <option value="">— Non assigné —</option>
                    {superviseurs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.prenom} {s.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabelClass}>Rôle</label>
                  <input
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    placeholder="Ex. Closer, Support client..."
                    className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>Objectif journalier</label>
                  <input
                    type="number"
                    min={0}
                    value={form.objectifJournalier}
                    onChange={(e) => setForm((f) => ({ ...f, objectifJournalier: e.target.value }))}
                    placeholder="Facultatif"
                    className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>Objectif hebdomadaire</label>
                  <input
                    type="number"
                    min={0}
                    value={form.objectifHebdo}
                    onChange={(e) => setForm((f) => ({ ...f, objectifHebdo: e.target.value }))}
                    placeholder="Facultatif"
                    className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}
            {vivier > 0 && (
              <div className="mt-3">
                <Button
                  variant="dark"
                  onClick={create}
                  disabled={
                    status === "saving" || !titulaireChoisi || !form.contratId || !form.role.trim()
                  }
                >
                  {status === "saving" ? "Assignation..." : "Assigner la mission"}
                </Button>
              </div>
            )}
            {error && <p className="mt-2 font-mono text-xs text-accent">{error}</p>}
          </div>
        )}

        {missions === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {missions === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}
        {Array.isArray(missions) && missions.length === 0 && (
          <p className="mt-4 font-sans text-sm text-white/50">Aucune mission pour l&apos;instant.</p>
        )}

        {Array.isArray(missions) && missions.length > 0 && (
          <div className="mt-4 space-y-2">
            {missions.map((m) => {
              const active = m.dateFin === null;
              return (
                <div
                  key={m.id}
                  className={`rounded border px-4 py-3 ${
                    active ? "border-white/10 bg-obsidian" : "border-white/5 bg-obsidian opacity-60"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-sans text-sm text-white">
                        {titulaire(m).nom}
                        <span className="ml-2 font-mono text-[11px] text-white/40">
                          {titulaire(m).matricule}
                        </span>
                        {!active && (
                          <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-accent">
                            Terminée
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-white/50">
                        {m.role} · {m.contrat.clientNom} ·{" "}
                        {m.superviseur ? `${m.superviseur.prenom} ${m.superviseur.nom}` : "Sans superviseur"}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-white/40">
                        {fmtDate(m.dateDebut)} → {fmtDate(m.dateFin)}
                        {(m.objectifJournalier !== null || m.objectifHebdo !== null) && (
                          <>
                            {" · objectifs "}
                            {m.objectifJournalier ?? "—"}/j · {m.objectifHebdo ?? "—"}/sem.
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">
                          QS /5
                        </label>
                        <input
                          value={qsDrafts[m.id] ?? ""}
                          onChange={(e) =>
                            setQsDrafts((d) => ({ ...d, [m.id]: e.target.value }))
                          }
                          onBlur={() => saveQs(m.id)}
                          placeholder="—"
                          className="w-16 rounded border border-white/15 bg-obsidianCard px-2 py-1 font-mono text-xs text-white placeholder:text-white/30 outline-none focus:border-accent"
                        />
                      </div>
                      {active && (
                        <button
                          onClick={() => cloturer(m.id)}
                          className="font-mono text-[11px] uppercase tracking-widest text-white/40 hover:text-accent"
                        >
                          Clôturer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Reveal>
  );
}
