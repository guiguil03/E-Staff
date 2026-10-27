"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface Superviseur {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  missions: { id: string }[]; // missions actives (dateFin=null)
  // Présent = le superviseur a un accès à son Espace (jamais le hash).
  compte: { id: string } | null;
}

const emptyForm = {
  matricule: "",
  prenom: "",
  nom: "",
  email: "",
  tarifFixe: "",
  moyenPaiementType: "",
  ribOuMobileMoney: "",
};

// Annuaire des superviseurs — même pattern que FormateursPanel côté
// Académie, transposé côté Production (voir ProductionService, module RH
// phase 4, 2026-08-26).
export default function SuperviseursPanel() {
  const [superviseurs, setSuperviseurs] = useState<Superviseur[] | "loading" | "erreur">(
    "loading"
  );
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // Envoie (ou renvoie) les identifiants : crée l'accès s'il n'existe pas.
  async function envoyerIdentifiants(s: Superviseur) {
    const nouveau = s.compte === null;
    if (
      !nouveau &&
      !window.confirm(`Générer un nouveau mot de passe pour ${s.prenom} ${s.nom} et l'envoyer par e-mail ?`)
    ) {
      return;
    }
    setActionId(s.id);
    setError(null);
    setMessage(null);
    try {
      const r = await apiPostAuthed<{ emailEnvoye: boolean }>(
        `/superviseurs/${s.id}/regenerer-identifiants`,
        {},
        adminHeaders()
      );
      setMessage(
        r.emailEnvoye
          ? `Identifiants envoyés à ${s.email}.`
          : `Accès créé pour ${s.prenom} ${s.nom}, mais l'e-mail n'a pas pu partir (fournisseur d'e-mail non configuré ?). Régénérez les identifiants une fois la messagerie configurée.`
      );
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi des identifiants.");
    } finally {
      setActionId(null);
    }
  }

  async function seConnecterEnTantQue(s: Superviseur) {
    setActionId(s.id);
    setError(null);
    try {
      const { token } = await apiPostAuthed<{ token: string }>(
        `/auth/view-as/superviseur/${s.matricule}`,
        {},
        adminHeaders()
      );
      window.open(`/compte/superviseur?viewAsToken=${token}`, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ouverture impossible.");
    } finally {
      setActionId(null);
    }
  }

  function refresh() {
    setSuperviseurs("loading");
    apiGet<Superviseur[]>("/production/superviseurs", adminHeaders())
      .then(setSuperviseurs)
      .catch(() => setSuperviseurs("erreur"));
  }

  useEffect(refresh, []);

  async function create() {
    if (!form.matricule.trim() || !form.prenom.trim() || !form.nom.trim() || !form.email.trim())
      return;
    setStatus("saving");
    setError(null);
    try {
      const cree = await apiPostAuthed<{ id: string; prenom: string; nom: string; email: string }>(
        "/production/superviseurs",
        {
          matricule: form.matricule,
          prenom: form.prenom,
          nom: form.nom,
          email: form.email,
          tarifFixe: form.tarifFixe ? Number(form.tarifFixe) : undefined,
          moyenPaiementType: form.moyenPaiementType || undefined,
          ribOuMobileMoney: form.ribOuMobileMoney.trim() || undefined,
        },
        adminHeaders()
      );
      setForm(emptyForm);
      setOpen(false);
      setStatus("idle");
      // Même flux que pour un agent : la création envoie directement les
      // identifiants par e-mail.
      await envoyerIdentifiants({ ...cree, matricule: form.matricule, missions: [], compte: null });
      refresh();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Erreur — vérifiez le matricule.");
    }
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-white">Superviseurs</h3>
          <button
            onClick={() => setOpen((o) => !o)}
            className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
          >
            {open ? "Fermer" : "+ Ajouter un superviseur"}
          </button>
        </div>

        {open && (
          <div className="mt-4 rounded border border-white/10 bg-obsidian p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Matricule
                </label>
                <input
                  value={form.matricule}
                  onChange={(e) => setForm((f) => ({ ...f, matricule: e.target.value }))}
                  placeholder="Ex. ETF-SUP-2026-0001"
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  E-mail
                </label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="superviseur@e-staf.mg"
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Prénom
                </label>
                <input
                  value={form.prenom}
                  onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Nom
                </label>
                <input
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Fixe mensuel
                </label>
                <input
                  type="number"
                  value={form.tarifFixe}
                  onChange={(e) => setForm((f) => ({ ...f, tarifFixe: e.target.value }))}
                  placeholder="Ex. 400000"
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Moyen de paiement
                </label>
                <select
                  value={form.moyenPaiementType}
                  onChange={(e) => setForm((f) => ({ ...f, moyenPaiementType: e.target.value }))}
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                >
                  <option value="">— Non renseigné —</option>
                  <option value="RIB">RIB</option>
                  <option value="MVola">MVola</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="Airtel Money">Airtel Money</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Numéro / RIB
                </label>
                <input
                  value={form.ribOuMobileMoney}
                  onChange={(e) => setForm((f) => ({ ...f, ribOuMobileMoney: e.target.value }))}
                  placeholder="Numéro Mobile Money ou RIB"
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="mt-3">
              <Button
                variant="dark"
                onClick={create}
                disabled={
                  status === "saving" ||
                  !form.matricule.trim() ||
                  !form.prenom.trim() ||
                  !form.nom.trim() ||
                  !form.email.trim()
                }
              >
                {status === "saving" ? "Création..." : "Créer le superviseur"}
              </Button>
            </div>
            {error && <p className="mt-2 font-mono text-xs text-accent">{error}</p>}
          </div>
        )}

        {superviseurs === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {superviseurs === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}
        {Array.isArray(superviseurs) && superviseurs.length === 0 && (
          <p className="mt-4 font-sans text-sm text-white/50">Aucun superviseur enregistré.</p>
        )}

        {message && (
          <p className="mt-4 rounded border border-success/40 bg-success/10 px-3 py-2 font-sans text-sm text-success">
            {message}
          </p>
        )}
        {error && !open && (
          <p className="mt-4 rounded border border-statusRed/40 bg-statusRed/10 px-3 py-2 font-sans text-sm text-statusRed">
            {error}
          </p>
        )}

        {Array.isArray(superviseurs) && superviseurs.length > 0 && (
          <div className="mt-4 space-y-2">
            {superviseurs.map((s) => (
              <div key={s.id} className="rounded border border-white/10 bg-obsidian px-4 py-3">
                <Link
                  href={`/compte/admin/superviseurs/${s.id}`}
                  className="block font-sans text-sm text-white hover:text-accent hover:underline"
                >
                  {s.prenom} {s.nom}
                </Link>
                <p className="font-mono text-[11px] text-white/40">
                  {s.matricule} · {s.email}
                </p>
                <p className="mt-1 font-sans text-xs text-white/50">
                  {s.missions.length} agent{s.missions.length > 1 ? "s" : ""} sous supervision
                  actuellement
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-widest ${
                      s.compte ? "text-success" : "text-accent"
                    }`}
                  >
                    {s.compte ? "● Accès actif" : "○ Pas d'accès"}
                  </span>
                  <button
                    onClick={() => envoyerIdentifiants(s)}
                    disabled={actionId === s.id}
                    className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline disabled:opacity-40"
                  >
                    {s.compte ? "Régénérer les identifiants" : "Envoyer les identifiants"}
                  </button>
                  {s.compte && (
                    <button
                      onClick={() => seConnecterEnTantQue(s)}
                      disabled={actionId === s.id}
                      className="font-mono text-[11px] uppercase tracking-widest text-white/60 hover:text-accent disabled:opacity-40"
                    >
                      Se connecter en tant que
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}
