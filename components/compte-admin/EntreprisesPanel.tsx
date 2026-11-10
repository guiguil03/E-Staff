"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface Entreprise {
  id: string;
  matricule: string;
  raisonSociale: string;
  contactNom: string;
  email: string;
  telephone: string | null;
  statut: string;
  peutSeConnecter: boolean;
  contrats: { id: string; clientNom: string; statut: string }[];
}

interface Contrat {
  id: string;
  clientNom: string;
  entrepriseId: string | null;
}

interface SuperviseurOption {
  id: string;
  prenom: string;
  nom: string;
}

interface Interet {
  id: string;
  entrepriseId: string;
  statut: string;
  posteSouhaite: string | null;
  message: string | null;
  createdAt: string;
  entreprise: { raisonSociale: string };
  agent: { prenom: string; nom: string; matricule: string } | null;
  apprenant: { prenom: string; nom: string; matricule: string } | null;
  contrat: { clientNom: string } | null;
}

interface EntretienRh {
  id: string;
  titre: string;
  startAt: string | null;
  dureeMinutes: number;
  createdAt: string;
  entreprise: string;
  candidat: string;
  salleDisponible: boolean;
}

const emptyForm = { raisonSociale: "", contactNom: "", email: "", telephone: "" };
const INPUT_CLS =
  "mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent";
const LABEL_CLS = "block font-mono text-xs uppercase tracking-widest text-white/50";

// Annuaire des comptes Entreprise (clients B2B) — même pattern que
// SuperviseursPanel : création + identifiants + "se connecter en tant que",
// avec en plus le rattachement de contrats et le traitement des intérêts du
// vivier de talents (voir EntreprisesComptesService).
export default function EntreprisesPanel() {
  const [entreprises, setEntreprises] = useState<Entreprise[] | "loading" | "erreur">("loading");
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [interets, setInterets] = useState<Interet[] | "loading" | "erreur">("loading");
  const [entretiens, setEntretiens] = useState<EntretienRh[] | "loading" | "erreur">("loading");
  const [rejoindreId, setRejoindreId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [contratChoisi, setContratChoisi] = useState<Record<string, string>>({});
  // Affectation en lot : profils cochés + paramètres communs saisis une fois.
  const [superviseurs, setSuperviseurs] = useState<SuperviseurOption[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [lot, setLot] = useState({ contratId: "", superviseurId: "", role: "", dateDebut: "" });
  const [lotBusy, setLotBusy] = useState(false);

  function refresh() {
    setEntreprises("loading");
    apiGet<Entreprise[]>("/entreprises-comptes", adminHeaders()).then(setEntreprises).catch(() => setEntreprises("erreur"));
    apiGet<Contrat[]>("/production/contrats", adminHeaders()).then(setContrats).catch(() => {});
    setInterets("loading");
    apiGet<Interet[]>("/entreprises-comptes/interets", adminHeaders()).then(setInterets).catch(() => setInterets("erreur"));
    apiGet<SuperviseurOption[]>("/production/superviseurs", adminHeaders()).then(setSuperviseurs).catch(() => {});
    setEntretiens("loading");
    apiGet<EntretienRh[]>("/entreprises-comptes/entretiens", adminHeaders()).then(setEntretiens).catch(() => setEntretiens("erreur"));
  }

  useEffect(refresh, []);

  // Accès RH à la salle d'un entretien (supervision) : lien nominatif émis à
  // la demande, onglet ouvert d'emblée pour éviter l'anti-popup.
  async function rejoindreEntretien(id: string) {
    setError(null);
    setRejoindreId(id);
    const win = window.open("", "_blank");
    try {
      const r = await apiPostAuthed<{ configured: boolean; url: string | null }>(
        `/entreprises-comptes/entretiens/${id}/rejoindre`,
        {},
        adminHeaders()
      );
      if (!r.url) throw new Error("La salle virtuelle n'est pas activée sur la plateforme.");
      if (win) win.location.href = r.url;
      else window.location.href = r.url;
    } catch (e) {
      win?.close();
      setError(e instanceof Error ? e.message : "Impossible d'ouvrir la salle.");
    } finally {
      setRejoindreId(null);
    }
  }

  // Seuls les profils pas encore affectés ni refusés peuvent être cochés.
  const affectables = Array.isArray(interets) ? interets.filter((i) => i.statut !== "affecte" && i.statut !== "refuse") : [];

  function basculerSelection(id: string) {
    setSelection((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  // Contrats proposables : ceux de l'entreprise des profils cochés, ou sans
  // entreprise rattachée (le serveur refuse de toute façon un contrat d'une
  // autre entreprise).
  const entreprisesChoisies = new Set(
    Array.isArray(interets) ? interets.filter((i) => selection.includes(i.id)).map((i) => i.entrepriseId) : []
  );
  const contratsLot = contrats.filter((c) => !c.entrepriseId || entreprisesChoisies.has(c.entrepriseId));

  async function affecterLot() {
    if (selection.length === 0 || !lot.contratId || !lot.role.trim() || !lot.dateDebut) return;
    setLotBusy(true);
    setError(null);
    setMessage(null);
    try {
      const r = await apiPostAuthed<{
        affectes: number;
        echecs: number;
        resultats: { interetId: string; ok: boolean; erreur?: string }[];
      }>(
        "/entreprises-comptes/interets/affecter-lot",
        {
          interetIds: selection,
          contratId: lot.contratId,
          superviseurId: lot.superviseurId || undefined,
          role: lot.role.trim(),
          dateDebut: new Date(lot.dateDebut).toISOString(),
        },
        adminHeaders()
      );
      const nomDe = (id: string) => {
        const i = Array.isArray(interets) ? interets.find((x) => x.id === id) : undefined;
        const p = i?.agent ?? i?.apprenant;
        return p ? `${p.prenom} ${p.nom}` : id;
      };
      const echecs = r.resultats.filter((x) => !x.ok).map((x) => `${nomDe(x.interetId)} : ${x.erreur}`);
      setMessage(`${r.affectes} profil(s) affecté(s) en une fois.`);
      if (echecs.length > 0) setError(`${echecs.length} échec(s) — ${echecs.join(" · ")}`);
      // Les profils en échec restent cochés pour une nouvelle tentative.
      setSelection(r.resultats.filter((x) => !x.ok).map((x) => x.interetId));
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'affectation en lot.");
    } finally {
      setLotBusy(false);
    }
  }

  async function create() {
    if (!form.raisonSociale.trim() || !form.contactNom.trim() || !form.email.trim()) return;
    setStatus("saving");
    setError(null);
    try {
      await apiPostAuthed(
        "/entreprises-comptes",
        {
          raisonSociale: form.raisonSociale,
          contactNom: form.contactNom,
          email: form.email,
          telephone: form.telephone.trim() || undefined,
        },
        adminHeaders()
      );
      setForm(emptyForm);
      setOpen(false);
      setStatus("idle");
      setMessage(`Compte créé et identifiants envoyés à ${form.email}.`);
      refresh();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Erreur lors de la création.");
    }
  }

  async function regenererIdentifiants(e: Entreprise) {
    if (e.peutSeConnecter && !window.confirm(`Générer un nouveau mot de passe pour ${e.raisonSociale} et l'envoyer par e-mail ?`)) {
      return;
    }
    setActionId(e.id);
    setError(null);
    setMessage(null);
    try {
      await apiPostAuthed(`/entreprises-comptes/${e.id}/regenerer-identifiants`, {}, adminHeaders());
      setMessage(`Identifiants envoyés à ${e.email}.`);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi des identifiants.");
    } finally {
      setActionId(null);
    }
  }

  async function seConnecterEnTantQue(e: Entreprise) {
    setActionId(e.id);
    setError(null);
    try {
      const { token } = await apiPostAuthed<{ token: string }>(
        `/auth/view-as/entreprise/${e.matricule}`,
        {},
        adminHeaders()
      );
      window.open(`/compte/entreprise?viewAsToken=${token}`, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ouverture impossible.");
    } finally {
      setActionId(null);
    }
  }

  async function rattacherContrat(e: Entreprise) {
    const contratId = contratChoisi[e.id];
    if (!contratId) return;
    setActionId(e.id);
    setError(null);
    try {
      await apiPostAuthed(`/entreprises-comptes/${e.id}/contrats`, { contratId }, adminHeaders());
      setMessage("Contrat rattaché.");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du rattachement.");
    } finally {
      setActionId(null);
    }
  }

  async function traiterInteret(id: string, statut: "propose" | "refuse") {
    setActionId(id);
    setError(null);
    try {
      await apiPut(`/entreprises-comptes/interets/${id}`, { statut }, adminHeaders());
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">Entreprises clientes</h3>
            <button
              onClick={() => setOpen((o) => !o)}
              className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
            >
              {open ? "Fermer" : "+ Ajouter une entreprise"}
            </button>
          </div>

          {open && (
            <div className="mt-4 rounded border border-white/10 bg-obsidian p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLS}>Raison sociale</label>
                  <input
                    value={form.raisonSociale}
                    onChange={(e) => setForm((f) => ({ ...f, raisonSociale: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Contact</label>
                  <input
                    value={form.contactNom}
                    onChange={(e) => setForm((f) => ({ ...f, contactNom: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>E-mail</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Téléphone</label>
                  <input
                    value={form.telephone}
                    onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Button
                  variant="dark"
                  onClick={create}
                  disabled={status === "saving" || !form.raisonSociale.trim() || !form.contactNom.trim() || !form.email.trim()}
                >
                  {status === "saving" ? "Création..." : "Créer l'entreprise"}
                </Button>
              </div>
            </div>
          )}

          {entreprises === "loading" && <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>}
          {entreprises === "erreur" && <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>}
          {Array.isArray(entreprises) && entreprises.length === 0 && (
            <p className="mt-4 font-sans text-sm text-white/50">Aucune entreprise enregistrée.</p>
          )}

          {message && (
            <p className="mt-4 rounded border border-success/40 bg-success/10 px-3 py-2 font-sans text-sm text-success">{message}</p>
          )}
          {error && (
            <p className="mt-4 rounded border border-statusRed/40 bg-statusRed/10 px-3 py-2 font-sans text-sm text-statusRed">{error}</p>
          )}

          {Array.isArray(entreprises) && entreprises.length > 0 && (
            <div className="mt-4 space-y-3">
              {entreprises.map((e) => (
                <div key={e.id} className="rounded border border-white/10 bg-obsidian px-4 py-3">
                  <p className="font-sans text-sm text-white">{e.raisonSociale}</p>
                  <p className="font-mono text-[11px] text-white/40">
                    {e.matricule} · {e.contactNom} · {e.email}
                  </p>
                  <p className="mt-1 font-sans text-xs text-white/50">
                    {e.contrats.length === 0 ? "Aucun contrat rattaché" : e.contrats.map((c) => c.clientNom).join(", ")}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className={`font-mono text-[10px] uppercase tracking-widest ${e.peutSeConnecter ? "text-success" : "text-accent"}`}>
                      {e.peutSeConnecter ? "● Accès actif" : "○ Pas d'accès"}
                    </span>
                    <button
                      onClick={() => regenererIdentifiants(e)}
                      disabled={actionId === e.id}
                      className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline disabled:opacity-40"
                    >
                      {e.peutSeConnecter ? "Régénérer les identifiants" : "Envoyer les identifiants"}
                    </button>
                    {e.peutSeConnecter && (
                      <button
                        onClick={() => seConnecterEnTantQue(e)}
                        disabled={actionId === e.id}
                        className="font-mono text-[11px] uppercase tracking-widest text-white/60 hover:text-accent disabled:opacity-40"
                      >
                        Se connecter en tant que
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={contratChoisi[e.id] ?? ""}
                      onChange={(ev) => setContratChoisi({ ...contratChoisi, [e.id]: ev.target.value })}
                      className="rounded border border-white/20 bg-obsidianCard px-2 py-1.5 font-sans text-xs text-white outline-none focus:border-accent"
                    >
                      <option value="">— Choisir un contrat —</option>
                      {contrats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.clientNom}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => rattacherContrat(e)}
                      disabled={actionId === e.id || !contratChoisi[e.id]}
                      className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline disabled:opacity-40"
                    >
                      Rattacher
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Entretiens planifiés par les entreprises</h3>
          <p className="mt-1 font-sans text-xs text-white/50">
            Salles d&apos;entretien virtuelles ouvertes par les entreprises avec un talent du vivier — vous pouvez rejoindre la salle pour
            superviser.
          </p>
          {entretiens === "loading" && <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>}
          {entretiens === "erreur" && <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>}
          {Array.isArray(entretiens) && entretiens.length === 0 && (
            <p className="mt-4 font-sans text-sm text-white/50">Aucun entretien planifié pour l&apos;instant.</p>
          )}
          {Array.isArray(entretiens) && entretiens.length > 0 && (
            <ul className="mt-4 space-y-2">
              {entretiens.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-obsidian px-4 py-3">
                  <div>
                    <p className="font-sans text-sm text-white">
                      {e.entreprise} → {e.candidat}
                    </p>
                    <p className="font-mono text-[11px] text-white/45">
                      {e.titre} · {e.startAt ? new Date(e.startAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "Date à définir"} ·{" "}
                      {e.dureeMinutes} min
                    </p>
                  </div>
                  {e.salleDisponible ? (
                    <button
                      onClick={() => rejoindreEntretien(e.id)}
                      disabled={rejoindreId === e.id}
                      className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline disabled:opacity-40"
                    >
                      {rejoindreId === e.id ? "Ouverture..." : "Rejoindre la salle"}
                    </button>
                  ) : (
                    <span className="font-mono text-[11px] text-white/35">Salle indisponible</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Intérêts du vivier de talents</h3>
          <p className="mt-1 font-sans text-xs text-white/50">
            Une entreprise a exprimé un intérêt pour un profil — proposez-le. Une fois les entretiens validés, cochez les profils
            retenus et affectez-les en une fois (contrat, superviseur, poste et date saisis une seule fois).
          </p>
          {interets === "loading" && <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>}
          {interets === "erreur" && <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>}
          {Array.isArray(interets) && interets.length === 0 && (
            <p className="mt-4 font-sans text-sm text-white/50">Aucun intérêt transmis pour l&apos;instant.</p>
          )}
          {affectables.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSelection(selection.length === affectables.length ? [] : affectables.map((i) => i.id))}
                className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
              >
                {selection.length === affectables.length ? "Tout décocher" : "Tout cocher"}
              </button>
              <span className="font-mono text-[11px] text-white/40">{selection.length} sélectionné(s)</span>
            </div>
          )}

          {selection.length > 0 && (
            <div className="mt-3 rounded border border-accent/40 bg-accent/5 p-4">
              <p className="font-sans text-sm font-semibold text-white">Affecter les {selection.length} profil(s) cochés</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLS} htmlFor="lot-contrat">Contrat</label>
                  <select
                    id="lot-contrat"
                    value={lot.contratId}
                    onChange={(e) => setLot((l) => ({ ...l, contratId: e.target.value }))}
                    className={INPUT_CLS}
                  >
                    <option value="">— Choisir un contrat —</option>
                    {contratsLot.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.clientNom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="lot-superviseur">Superviseur</label>
                  <select
                    id="lot-superviseur"
                    value={lot.superviseurId}
                    onChange={(e) => setLot((l) => ({ ...l, superviseurId: e.target.value }))}
                    className={INPUT_CLS}
                  >
                    <option value="">— Sans superviseur —</option>
                    {superviseurs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.prenom} {s.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="lot-role">Poste / rôle</label>
                  <input
                    id="lot-role"
                    value={lot.role}
                    onChange={(e) => setLot((l) => ({ ...l, role: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="lot-debut">Date de début</label>
                  <input
                    id="lot-debut"
                    type="date"
                    value={lot.dateDebut}
                    onChange={(e) => setLot((l) => ({ ...l, dateDebut: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Button onClick={affecterLot} disabled={lotBusy || !lot.contratId || !lot.role.trim() || !lot.dateDebut}>
                  {lotBusy ? "Affectation..." : `Affecter ${selection.length} profil(s)`}
                </Button>
              </div>
            </div>
          )}

          {Array.isArray(interets) && interets.length > 0 && (
            <ul className="mt-4 space-y-2">
              {interets.map((i) => (
                <li key={i.id} className="flex items-start gap-3 rounded border border-white/10 bg-obsidian px-4 py-3">
                  {i.statut !== "affecte" && i.statut !== "refuse" ? (
                    <input
                      type="checkbox"
                      aria-label="Sélectionner ce profil"
                      checked={selection.includes(i.id)}
                      onChange={() => basculerSelection(i.id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-accent"
                    />
                  ) : (
                    <span className="mt-1 inline-block h-4 w-4 shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm text-white">
                    {i.entreprise.raisonSociale} →{" "}
                    {i.agent ? `${i.agent.prenom} ${i.agent.nom} (${i.agent.matricule})` : i.apprenant ? `${i.apprenant.prenom} ${i.apprenant.nom} (${i.apprenant.matricule})` : "—"}
                  </p>
                  {i.message && <p className="mt-1 font-sans text-xs italic text-white/50">« {i.message} »</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-accent">{i.statut}</span>
                    {i.statut === "nouveau" && (
                      <>
                        <button
                          onClick={() => traiterInteret(i.id, "propose")}
                          disabled={actionId === i.id}
                          className="font-mono text-[11px] uppercase tracking-widest text-success hover:underline disabled:opacity-40"
                        >
                          Proposer
                        </button>
                        <button
                          onClick={() => traiterInteret(i.id, "refuse")}
                          disabled={actionId === i.id}
                          className="font-mono text-[11px] uppercase tracking-widest text-statusRed hover:underline disabled:opacity-40"
                        >
                          Non disponible
                        </button>
                      </>
                    )}
                  </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>
    </div>
  );
}
