"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface Vague {
  id: string;
  cle: string;
  label: string;
  typeCours: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  formateurNom: string | null;
  apprenantsCount: number;
  tauxReussite: number;
}

const emptyForm = { cle: "", label: "" };

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function tauxColor(taux: number): string {
  if (taux >= 60) return "text-success";
  if (taux >= 30) return "text-accent";
  return "text-white/50";
}

// Vue "Vagues de formation" — chaque groupe A-F (et au-delà) avec son type
// de cours, ses dates, son formateur et son vrai taux de réussite (voir
// RhService.getVagues + CockpitService.getTauxReussiteParGroupe). Remplace
// l'ancienne simple liste de chips A-F par une vraie table de pilotage —
// la création de groupe reste identique (voir brainstorm 2026-08-09), seule
// la partie affichage/édition change.
export default function GroupesPanel() {
  const [vagues, setVagues] = useState<Vague[] | "loading" | "erreur">("loading");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { typeCours: string; dateDebut: string; dateFin: string }>>(
    {}
  );

  function refresh() {
    setVagues("loading");
    apiGet<Vague[]>("/rh/vagues", adminHeaders())
      .then((list) => {
        setVagues(list);
        setDrafts(
          Object.fromEntries(
            list.map((v) => [
              v.id,
              {
                typeCours: v.typeCours ?? "",
                dateDebut: toDateInputValue(v.dateDebut),
                dateFin: toDateInputValue(v.dateFin),
              },
            ])
          )
        );
      })
      .catch(() => setVagues("erreur"));
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

  async function saveTypeCours(vagueId: string) {
    const value = drafts[vagueId]?.typeCours.trim() ?? "";
    await apiPut(`/rh/groupes/${vagueId}/type-cours`, { typeCours: value || null }, adminHeaders());
    refresh();
  }

  async function saveDates(vagueId: string) {
    const d = drafts[vagueId];
    if (!d) return;
    await apiPut(
      `/rh/groupes/${vagueId}/dates`,
      {
        dateDebut: d.dateDebut ? new Date(d.dateDebut).toISOString() : null,
        dateFin: d.dateFin ? new Date(d.dateFin).toISOString() : null,
      },
      adminHeaders()
    );
    refresh();
  }

  return (
    <Reveal delay={40}>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-white">Vagues de formation</h3>
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

        {vagues === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {vagues === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}

        {Array.isArray(vagues) && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-widest text-white/40">
                  <th className="py-2 pr-4">Vague</th>
                  <th className="py-2 pr-4">Type de cours</th>
                  <th className="py-2 pr-4">Début</th>
                  <th className="py-2 pr-4">Fin</th>
                  <th className="py-2 pr-4">Formateur</th>
                  <th className="py-2 pr-4">Taux de réussite</th>
                </tr>
              </thead>
              <tbody>
                {vagues.map((v) => (
                  <tr key={v.id} className="border-b border-white/5">
                    <td className="py-2.5 pr-4 font-sans text-sm text-white">
                      {v.label}
                      <span className="ml-1.5 font-mono text-[11px] text-white/40">
                        ({v.apprenantsCount})
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <input
                        value={drafts[v.id]?.typeCours ?? ""}
                        onChange={(e) =>
                          setDrafts((d) => ({
                            ...d,
                            [v.id]: { ...d[v.id], typeCours: e.target.value },
                          }))
                        }
                        onBlur={() => saveTypeCours(v.id)}
                        placeholder="DELF/DALF, TEF..."
                        className="w-40 rounded border border-white/15 bg-obsidian px-2 py-1 font-sans text-xs text-white placeholder:text-white/30 outline-none focus:border-accent"
                      />
                    </td>
                    <td className="py-2.5 pr-4">
                      <input
                        type="date"
                        value={drafts[v.id]?.dateDebut ?? ""}
                        onChange={(e) =>
                          setDrafts((d) => ({
                            ...d,
                            [v.id]: { ...d[v.id], dateDebut: e.target.value },
                          }))
                        }
                        onBlur={() => saveDates(v.id)}
                        className="rounded border border-white/15 bg-obsidian px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent"
                      />
                    </td>
                    <td className="py-2.5 pr-4">
                      <input
                        type="date"
                        value={drafts[v.id]?.dateFin ?? ""}
                        onChange={(e) =>
                          setDrafts((d) => ({
                            ...d,
                            [v.id]: { ...d[v.id], dateFin: e.target.value },
                          }))
                        }
                        onBlur={() => saveDates(v.id)}
                        className="rounded border border-white/15 bg-obsidian px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent"
                      />
                    </td>
                    <td className="py-2.5 pr-4 font-sans text-xs text-white/60">
                      {v.formateurNom ?? "—"}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono text-xs ${tauxColor(v.tauxReussite)}`}>
                      {v.tauxReussite}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Reveal>
  );
}
