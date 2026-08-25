"use client";

import { useEffect, useState } from "react";
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

// Annuaire des formateurs + assignation aux groupes — jusqu'ici aucun lien
// n'existait entre un Formateur et un Groupe en base (voir Groupe.formateurId,
// migration 20260825164047). Reste un annuaire "matricule/nom/email", pas un
// vrai système de comptes individuels : le login formateur garde le stopgap
// partagé (FORMATEUR_TEST_MATRICULE), volontairement inchangé ici.
export default function FormateursPanel() {
  const [formateurs, setFormateurs] = useState<Formateur[] | "loading" | "erreur">("loading");
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

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
      await apiPostAuthed("/rh/formateurs", form, adminHeaders());
      setForm(emptyForm);
      setOpen(false);
      setStatus("idle");
      refresh();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Erreur — vérifiez le matricule.");
    }
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
            onClick={() => setOpen((o) => !o)}
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
              <div key={f.id} className="rounded border border-white/10 bg-obsidian px-4 py-3">
                <p className="font-sans text-sm text-white">
                  {f.prenom} {f.nom}
                </p>
                <p className="font-mono text-[11px] text-white/40">
                  {f.matricule} · {f.email}
                </p>
                <p className="mt-1 font-sans text-xs text-white/50">
                  {f.groupes.length > 0
                    ? `Groupes : ${f.groupes.map((g) => g.label).join(", ")}`
                    : "Aucun groupe assigné"}
                </p>
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
