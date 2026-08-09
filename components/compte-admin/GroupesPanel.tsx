"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface GroupeAvecPlaces {
  id: string;
  cle: string;
  label: string;
  placesRestantes: number;
}

function adminHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-admin-matricule": matricule } : {};
}

const emptyForm = { cle: "", label: "" };

// Les groupes A-F sont figés en base au lancement (seed) — ce panneau
// permet d'en ajouter d'autres sans intervention manuelle en base une fois
// le recrutement plus rapide que prévu (voir brainstorm 2026-08-09).
export default function GroupesPanel() {
  const [groupes, setGroupes] = useState<GroupeAvecPlaces[] | "loading" | "erreur">("loading");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setGroupes("loading");
    apiGet<GroupeAvecPlaces[]>("/evaluation/groupes-avec-places", adminHeaders())
      .then(setGroupes)
      .catch(() => setGroupes("erreur"));
  }

  useEffect(refresh, []);

  async function create() {
    if (!form.cle.trim() || !form.label.trim()) return;
    setStatus("saving");
    setError(null);
    try {
      await apiPostAuthed(
        "/evaluation/groupes",
        { cle: form.cle.trim().toUpperCase(), label: form.label.trim() },
        adminHeaders()
      );
      setForm(emptyForm);
      setOpen(false);
      setStatus("idle");
      refresh();
    } catch {
      setStatus("error");
      setError("Erreur — vérifiez que la clé n'est pas déjà utilisée.");
    }
  }

  return (
    <Reveal delay={40}>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-white">Groupes</h3>
          <button
            onClick={() => setOpen((o) => !o)}
            className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
          >
            {open ? "Fermer" : "+ Ajouter un groupe"}
          </button>
        </div>

        {open && (
          <div className="mt-4 rounded border border-white/10 bg-obsidian p-4">
            <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Clé
                </label>
                <input
                  value={form.cle}
                  onChange={(e) => setForm((f) => ({ ...f, cle: e.target.value }))}
                  placeholder="Ex. G"
                  maxLength={4}
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Nom du groupe
                </label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Ex. Groupe G"
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="mt-3">
              <Button
                variant="dark"
                onClick={create}
                disabled={status === "saving" || !form.cle.trim() || !form.label.trim()}
              >
                {status === "saving" ? "Création..." : "Créer le groupe"}
              </Button>
            </div>
            {error && <p className="mt-2 font-mono text-xs text-accent">{error}</p>}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {groupes === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
          {groupes === "erreur" && (
            <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>
          )}
          {Array.isArray(groupes) &&
            groupes.map((g) => (
              <span
                key={g.id}
                className="rounded border border-white/10 bg-obsidian px-3 py-2 font-mono text-xs text-white/70"
              >
                {g.label} · {g.placesRestantes} place{g.placesRestantes > 1 ? "s" : ""}
              </span>
            ))}
        </div>
      </div>
    </Reveal>
  );
}
