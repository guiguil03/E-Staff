"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiDelete, apiGet, apiPostAuthed, apiPut, ApiError } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface Agent {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  statut: string;
  poste: string | null;
  dateEmbauche: string | null;
  salaireBase: number | null;
  peutSeConnecter: boolean;
  contratDepose: boolean;
  missionsCount: number;
  missionActive: {
    id: string;
    clientNom: string;
    role: string;
    dateDebut: string;
    superviseurNom: string | null;
  } | null;
}

const STATUTS = [
  { value: "essai", label: "Période d'essai" },
  { value: "actif", label: "En poste" },
  { value: "inactif", label: "Désactivé" },
] as const;

const STATUT_CLASSES: Record<string, string> = {
  essai: "border-accent/40 bg-accent/10 text-accent",
  actif: "border-success/40 bg-success/10 text-success",
  inactif: "border-white/20 bg-white/5 text-white/50",
};

const emptyForm = {
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  poste: "",
  statut: "essai",
  dateEmbauche: "",
  salaireBase: "",
  moyenPaiementType: "",
  ribOuMobileMoney: "",
};

const inputClass =
  "w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

function messageErreur(err: unknown): string {
  return err instanceof ApiError || err instanceof Error
    ? err.message
    : "Une erreur est survenue.";
}

// Annuaire des agents de production + création de leur compte. Même
// mécanique que FormateursPanel : le matricule est généré par le backend
// ("ETF-AG-AAAA-NNNN") et un mot de passe temporaire part par e-mail à la
// création — l'agent se connecte ensuite à son Espace Agent (performances,
// temps travaillé, contrat, paiements). Un agent qui a déjà travaillé ne se
// supprime pas : on le passe en « Désactivé », ce qui coupe l'accès sans
// perdre l'historique de missions et de paie.
export default function AgentsPanel() {
  const [agents, setAgents] = useState<Agent[] | "loading" | "erreur">("loading");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function refresh() {
    setAgents("loading");
    apiGet<Agent[]>("/agents", adminHeaders())
      .then(setAgents)
      .catch(() => setAgents("erreur"));
  }

  useEffect(refresh, []);

  async function create() {
    if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim()) return;
    setStatus("saving");
    setError(null);
    try {
      await apiPostAuthed(
        "/agents",
        {
          prenom: form.prenom.trim(),
          nom: form.nom.trim(),
          email: form.email.trim(),
          telephone: form.telephone.trim() || null,
          poste: form.poste.trim() || null,
          statut: form.statut,
          dateEmbauche: form.dateEmbauche || null,
          salaireBase: form.salaireBase ? Number(form.salaireBase) : null,
          moyenPaiementType: form.moyenPaiementType.trim() || null,
          ribOuMobileMoney: form.ribOuMobileMoney.trim() || null,
        },
        adminHeaders()
      );
      setForm(emptyForm);
      setStatus("success");
      setMessage("Compte créé — les identifiants ont été envoyés par e-mail à l'agent.");
      refresh();
    } catch (err) {
      setStatus("error");
      setError(messageErreur(err));
    }
  }

  // Le changement de statut renvoie les champs d'identité tels quels (le
  // DTO d'upsert les exige) — seule la valeur du statut change.
  async function changerStatut(agent: Agent, statut: string) {
    setActionId(agent.id);
    setError(null);
    try {
      await apiPut(
        `/agents/${agent.id}`,
        {
          prenom: agent.prenom,
          nom: agent.nom,
          email: agent.email,
          telephone: agent.telephone,
          poste: agent.poste,
          statut,
        },
        adminHeaders()
      );
      refresh();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setActionId(null);
    }
  }

  async function regenerer(agent: Agent) {
    setActionId(agent.id);
    setError(null);
    setMessage(null);
    try {
      await apiPostAuthed(`/agents/${agent.id}/regenerer-identifiants`, {}, adminHeaders());
      setMessage(`Nouveaux identifiants envoyés à ${agent.email}.`);
      refresh();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setActionId(null);
    }
  }

  async function seConnecterEnTantQue(agent: Agent) {
    setActionId(agent.id);
    setError(null);
    try {
      const { token } = await apiPostAuthed<{ token: string }>(
        `/auth/view-as/agent/${agent.matricule}`,
        {},
        adminHeaders()
      );
      window.open(`/compte/agent?viewAsToken=${token}`, "_blank");
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setActionId(null);
    }
  }

  async function supprimer(agent: Agent) {
    if (
      !window.confirm(
        `Supprimer définitivement le compte de ${agent.prenom} ${agent.nom} (${agent.matricule}) ?`
      )
    )
      return;
    setActionId(agent.id);
    setError(null);
    try {
      await apiDelete(`/agents/${agent.id}`, adminHeaders());
      refresh();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setActionId(null);
    }
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              Agents de production
            </h2>
            <p className="mt-1 font-sans text-sm text-white/60">
              Les agents qui passent les appels pour les clients. La création d&apos;un compte
              génère son matricule et lui envoie ses identifiants par e-mail.
            </p>
          </div>
          <Button variant="dark" onClick={() => setOpen((v) => !v)}>
            {open ? "Fermer" : "Nouvel agent"}
          </Button>
        </div>

        {open && (
          <div className="mt-5 rounded border border-white/10 bg-obsidian p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={LABEL} htmlFor="agent-prenom">
                  Prénom *
                </label>
                <input
                  id="agent-prenom"
                  className={`mt-1 ${inputClass}`}
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="agent-nom">
                  Nom *
                </label>
                <input
                  id="agent-nom"
                  className={`mt-1 ${inputClass}`}
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="agent-email">
                  E-mail * (reçoit les identifiants)
                </label>
                <input
                  id="agent-email"
                  type="email"
                  className={`mt-1 ${inputClass}`}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="agent-telephone">
                  Téléphone
                </label>
                <input
                  id="agent-telephone"
                  className={`mt-1 ${inputClass}`}
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="agent-poste">
                  Poste
                </label>
                <input
                  id="agent-poste"
                  placeholder="Téléopérateur, Closer..."
                  className={`mt-1 ${inputClass}`}
                  value={form.poste}
                  onChange={(e) => setForm({ ...form, poste: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="agent-statut">
                  Statut
                </label>
                <select
                  id="agent-statut"
                  className={`mt-1 ${inputClass}`}
                  value={form.statut}
                  onChange={(e) => setForm({ ...form, statut: e.target.value })}
                >
                  {STATUTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="agent-embauche">
                  Date d&apos;embauche
                </label>
                <input
                  id="agent-embauche"
                  type="date"
                  className={`mt-1 ${inputClass}`}
                  value={form.dateEmbauche}
                  onChange={(e) => setForm({ ...form, dateEmbauche: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="agent-salaire">
                  Salaire de base (Ar / mois)
                </label>
                <input
                  id="agent-salaire"
                  type="number"
                  min={0}
                  className={`mt-1 ${inputClass}`}
                  value={form.salaireBase}
                  onChange={(e) => setForm({ ...form, salaireBase: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="agent-moyen">
                  Moyen de paiement
                </label>
                <input
                  id="agent-moyen"
                  placeholder="MVola, Orange Money, RIB..."
                  className={`mt-1 ${inputClass}`}
                  value={form.moyenPaiementType}
                  onChange={(e) => setForm({ ...form, moyenPaiementType: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="agent-rib">
                  Numéro RIB / Mobile Money
                </label>
                <input
                  id="agent-rib"
                  className={`mt-1 ${inputClass}`}
                  value={form.ribOuMobileMoney}
                  onChange={(e) => setForm({ ...form, ribOuMobileMoney: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button variant="dark" onClick={create} disabled={status === "saving"}>
                {status === "saving" ? "Création..." : "Créer le compte"}
              </Button>
              <p className="font-sans text-xs text-white/40">
                Le matricule est généré automatiquement.
              </p>
            </div>
          </div>
        )}

        {error && <p className="mt-4 font-sans text-sm text-accent">{error}</p>}
        {message && !error && <p className="mt-4 font-sans text-sm text-success">{message}</p>}

        <div className="mt-6">
          {agents === "loading" && (
            <p className="font-sans text-sm text-white/50">Chargement...</p>
          )}
          {agents === "erreur" && (
            <p className="font-sans text-sm text-white/50">
              Impossible de charger l&apos;annuaire des agents.
            </p>
          )}
          {Array.isArray(agents) && agents.length === 0 && (
            <p className="font-sans text-sm text-white/50">
              Aucun agent pour l&apos;instant — créez le premier compte avec « Nouvel agent ».
            </p>
          )}
          {Array.isArray(agents) && agents.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={`${LABEL} py-2`}>Matricule</th>
                    <th className={`${LABEL} py-2`}>Agent</th>
                    <th className={`${LABEL} py-2`}>Poste</th>
                    <th className={`${LABEL} py-2`}>Mission active</th>
                    <th className={`${LABEL} py-2`}>Embauche</th>
                    <th className={`${LABEL} py-2`}>Statut</th>
                    <th className={`${LABEL} py-2`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a) => (
                    <tr key={a.id} className="border-b border-white/5 align-top">
                      <td className="py-3 font-mono text-xs text-white/70">
                        {a.matricule}
                        {!a.peutSeConnecter && (
                          <span className="mt-1 block font-sans text-[11px] text-accent">
                            Pas d&apos;accès — régénérez ses identifiants
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <p className="font-sans text-sm text-white">
                          {a.prenom} {a.nom}
                        </p>
                        <p className="font-sans text-xs text-white/40">{a.email}</p>
                        {a.telephone && (
                          <p className="font-sans text-xs text-white/40">{a.telephone}</p>
                        )}
                      </td>
                      <td className="py-3 font-sans text-sm text-white/70">{a.poste ?? "—"}</td>
                      <td className="py-3">
                        {a.missionActive ? (
                          <>
                            <p className="font-sans text-sm text-white">
                              {a.missionActive.clientNom}
                            </p>
                            <p className="font-sans text-xs text-white/40">
                              {a.missionActive.role}
                              {a.missionActive.superviseurNom
                                ? ` · ${a.missionActive.superviseurNom}`
                                : ""}
                            </p>
                          </>
                        ) : (
                          <span className="font-sans text-sm text-white/40">
                            Disponible{a.missionsCount > 0 ? ` (${a.missionsCount} passée(s))` : ""}
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-xs text-white/70">
                        {fmtDate(a.dateEmbauche)}
                      </td>
                      <td className="py-3">
                        <select
                          aria-label={`Statut de ${a.prenom} ${a.nom}`}
                          value={a.statut}
                          disabled={actionId === a.id}
                          onChange={(e) => changerStatut(a, e.target.value)}
                          className={`rounded border px-2 py-1 font-mono text-[11px] uppercase tracking-widest ${
                            STATUT_CLASSES[a.statut] ?? "border-white/20 text-white/60"
                          }`}
                        >
                          {STATUTS.map((s) => (
                            <option key={s.value} value={s.value} className="text-obsidian">
                              {s.label}
                            </option>
                          ))}
                        </select>
                        {a.contratDepose && (
                          <p className="mt-1 font-sans text-[11px] text-white/40">
                            Contrat déposé
                          </p>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/compte/admin/agents-production/${a.id}`}
                            className="rounded border border-accent px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-obsidian"
                          >
                            Casier
                          </Link>
                          <button
                            onClick={() => seConnecterEnTantQue(a)}
                            disabled={actionId === a.id || a.statut === "inactif"}
                            className="rounded border border-white/20 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
                          >
                            Se connecter en tant que
                          </button>
                          <button
                            onClick={() => regenerer(a)}
                            disabled={actionId === a.id || a.statut === "inactif"}
                            className="rounded border border-white/20 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
                          >
                            Régénérer identifiants
                          </button>
                          {a.missionsCount === 0 && (
                            <button
                              onClick={() => supprimer(a)}
                              disabled={actionId === a.id}
                              className="rounded border border-red-500 bg-red-600 px-2.5 py-1 font-sans text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}
