"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface Groupe {
  id: string;
  cle: string;
  label: string;
}

interface Formateur {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  groupes: Groupe[];
}

const emptyForm = { matricule: "", prenom: "", nom: "", email: "" };

// Annuaire des formateurs + assignation aux groupes. Depuis le 2026-09-16,
// chaque formateur a son propre compte (matricule + mot de passe temporaire
// envoyé par e-mail à la création — voir RhService.createFormateur) : le
// Cockpit Formateur se filtre désormais sur Groupe.formateurId au lieu du
// login partagé FORMATEUR_TEST_MATRICULE d'avant.
export default function FormateursPanel() {
  const [formateurs, setFormateurs] = useState<Formateur[] | "loading" | "erreur">("loading");
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedGroupeIds, setSelectedGroupeIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [openingViewAsId, setOpeningViewAsId] = useState<string | null>(null);

  function refresh() {
    setFormateurs("loading");
    apiGet<Formateur[]>("/rh/formateurs", adminHeaders())
      .then(setFormateurs)
      .catch(() => setFormateurs("erreur"));
    apiGet<{ id: string; cle: string; label: string }[]>(
      "/evaluation/groupes-avec-places",
      adminHeaders()
    )
      .then(setGroupes)
      .catch(() => setGroupes([]));
  }

  useEffect(refresh, []);

  async function create() {
    if (!form.matricule.trim() || !form.prenom.trim() || !form.nom.trim() || !form.email.trim())
      return;
    setStatus("saving");
    setError(null);
    try {
      await apiPostAuthed(
        "/rh/formateurs",
        { ...form, groupeIds: selectedGroupeIds },
        adminHeaders()
      );
      setForm(emptyForm);
      setSelectedGroupeIds([]);
      setStatus("success");
      refresh();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Erreur — vérifiez le matricule.");
    }
  }

  function toggleGroupeSelection(groupeId: string) {
    setSelectedGroupeIds((ids) =>
      ids.includes(groupeId) ? ids.filter((id) => id !== groupeId) : [...ids, groupeId]
    );
  }

  async function assignGroupe(groupeId: string, formateurId: string) {
    setAssigning(groupeId);
    try {
      await apiPut(
        `/rh/groupes/${groupeId}/formateur`,
        { formateurId: formateurId || null },
        adminHeaders()
      );
      refresh();
    } finally {
      setAssigning(null);
    }
  }

  async function regenerateCredentials(id: string) {
    setRegeneratingId(id);
    try {
      await apiPostAuthed(`/rh/formateurs/${id}/regenerer-identifiants`, {}, adminHeaders());
    } finally {
      setRegeneratingId(null);
    }
  }

  async function seConnecterEnTantQue(matricule: string) {
    setOpeningViewAsId(matricule);
    try {
      const { token } = await apiPostAuthed<{ token: string }>(
        `/auth/view-as/formateur/${matricule}`,
        {},
        adminHeaders()
      );
      window.open(`/compte/formateur?viewAsToken=${token}`, "_blank");
    } finally {
      setOpeningViewAsId(null);
    }
  }

  const formateurByGroupeId = new Map<string, Formateur>();
  if (Array.isArray(formateurs)) {
    for (const f of formateurs) {
      for (const g of f.groupes) formateurByGroupeId.set(g.id, f);
    }
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-white">
            Formateurs &amp; assignation aux groupes
          </h3>
          <button
            onClick={() => {
              setOpen((o) => !o);
              setStatus("idle");
              setSelectedGroupeIds([]);
            }}
            className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
          >
            {open ? "Fermer" : "+ Ajouter un formateur"}
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
                  placeholder="Ex. ETF-FORM-2026-0002"
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
                  placeholder="formateur@e-staf.mg"
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
            </div>

            <div className="mt-3">
              <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                Groupes à assigner (facultatif)
              </label>
              {groupes.length === 0 ? (
                <p className="mt-1 font-sans text-xs text-white/40">Aucun groupe pour l&apos;instant.</p>
              ) : (
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {groupes.map((g) => {
                    const checked = selectedGroupeIds.includes(g.id);
                    return (
                      <label
                        key={g.id}
                        className={`flex cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1 font-sans text-xs transition-colors ${
                          checked
                            ? "border-accent/60 bg-accent/10 text-accent"
                            : "border-white/15 text-white/60 hover:border-white/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleGroupeSelection(g.id)}
                          className="sr-only"
                        />
                        {g.label}
                      </label>
                    );
                  })}
                </div>
              )}
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
                {status === "saving" ? "Création..." : "Créer le formateur"}
              </Button>
            </div>
            {error && <p className="mt-2 font-mono text-xs text-accent">{error}</p>}
            {status === "success" && (
              <p className="mt-2 font-mono text-xs text-success">
                Compte créé — identifiants envoyés par e-mail.
              </p>
            )}
          </div>
        )}

        {formateurs === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {formateurs === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}
        {Array.isArray(formateurs) && formateurs.length === 0 && (
          <p className="mt-4 font-sans text-sm text-white/50">Aucun formateur enregistré.</p>
        )}

        {Array.isArray(formateurs) && formateurs.length > 0 && (
          <div className="mt-4 space-y-2">
            {formateurs.map((f) => (
              <div
                key={f.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded border border-white/10 bg-obsidian px-4 py-3"
              >
                <div>
                  <Link
                    href={`/compte/admin/formateurs/${f.id}`}
                    className="block font-sans text-sm text-white hover:text-accent hover:underline"
                  >
                    {f.prenom} {f.nom}
                  </Link>
                  <p className="font-mono text-[11px] text-white/40">
                    {f.matricule} · {f.email}
                  </p>
                  <p className="mt-1 font-sans text-xs text-white/50">
                    {f.groupes.length > 0
                      ? `Groupes : ${f.groupes.map((g) => g.label).join(", ")}`
                      : "Aucun groupe assigné"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    onClick={() => seConnecterEnTantQue(f.matricule)}
                    disabled={openingViewAsId === f.matricule}
                    className="whitespace-nowrap rounded border border-accent/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
                  >
                    {openingViewAsId === f.matricule ? "Ouverture..." : "Se connecter en tant que"}
                  </button>
                  <button
                    onClick={() => regenerateCredentials(f.id)}
                    disabled={regeneratingId === f.id}
                    title="Envoie un nouveau mot de passe temporaire par e-mail"
                    className="whitespace-nowrap rounded border border-white/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/50 hover:border-white/30 hover:text-white disabled:opacity-50"
                  >
                    {regeneratingId === f.id ? "..." : "Régénérer les identifiants"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="font-mono text-xs uppercase tracking-widest text-white/50">
            Assigner un groupe à un formateur
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {groupes.map((g) => {
              const current = formateurByGroupeId.get(g.id);
              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between gap-2 rounded border border-white/10 bg-obsidian px-3 py-2"
                >
                  <span className="font-sans text-xs text-white/70">{g.label}</span>
                  <select
                    value={current?.id ?? ""}
                    disabled={assigning === g.id || !Array.isArray(formateurs)}
                    onChange={(e) => assignGroupe(g.id, e.target.value)}
                    className="rounded border border-white/20 bg-obsidianCard px-2 py-1 font-sans text-xs text-white outline-none focus:border-accent disabled:opacity-50"
                  >
                    <option value="">— Non assigné —</option>
                    {Array.isArray(formateurs) &&
                      formateurs.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.prenom} {f.nom}
                        </option>
                      ))}
                  </select>
                </div>
              );
            })}
            {groupes.length === 0 && (
              <p className="font-sans text-xs text-white/40">Aucun groupe pour l&apos;instant.</p>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
