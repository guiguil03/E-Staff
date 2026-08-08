"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import ValidationRhPanel from "./ValidationRhPanel";
import PaiementsPanel from "./PaiementsPanel";
import PipelineOverviewPanel from "./PipelineOverviewPanel";

interface ForumLiveApi {
  id: string;
  titre: string;
  invite: string;
  description: string | null;
  startAt: string | null;
  dureeMinutes: number;
  dailyRoomName: string | null;
}

function adminHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-admin-matricule": matricule } : {};
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = { titre: "", invite: "", description: "", startAtInput: "", dureeMinutes: 60 };

// Espace Admin — planification du "Live du mois" du Forum et rédaction de
// ses infos (titre, invité, description). Rôle distinct de Formateur : la
// pédagogie (Cockpit Formateur) et la communication publique (Forum) sont
// deux métiers différents, cf. discussion produit du 2026-08-07.
export default function AdminDashboard() {
  const checked = useRequireRole("admin");
  const [lives, setLives] = useState<ForumLiveApi[] | "loading" | "erreur">("loading");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  function refresh() {
    setLives("loading");
    apiGet<ForumLiveApi[]>("/forum/lives", adminHeaders())
      .then(setLives)
      .catch(() => setLives("erreur"));
  }

  useEffect(() => {
    if (!checked) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  function editLive(live: ForumLiveApi) {
    setEditingId(live.id);
    setForm({
      titre: live.titre,
      invite: live.invite,
      description: live.description ?? "",
      startAtInput: live.startAt ? toDatetimeLocalValue(live.startAt) : "",
      dureeMinutes: live.dureeMinutes,
    });
  }

  function newLive() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save() {
    if (!form.titre.trim() || !form.invite.trim()) return;
    setStatus("saving");
    try {
      const payload = {
        titre: form.titre,
        invite: form.invite,
        description: form.description || undefined,
        startAt: form.startAtInput ? new Date(form.startAtInput).toISOString() : undefined,
        dureeMinutes: form.dureeMinutes,
      };
      if (editingId) {
        await apiPut(`/forum/lives/${editingId}`, payload, adminHeaders());
      } else {
        await apiPostAuthed("/forum/lives", payload, adminHeaders());
      }
      setStatus("idle");
      newLive();
      refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/forum"
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Voir le Forum public
        </Link>

        <Reveal>
          <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            Espace Admin
          </h1>
          <p className="mt-1 font-sans text-sm text-white/60">
            Validation RH des candidats, confirmation des paiements et planification du Forum.
          </p>
        </Reveal>

        <Reveal delay={20}>
          <h2 className="mt-8 font-display text-lg font-semibold text-white">
            RH — Suivi des candidats
          </h2>
        </Reveal>
        <div className="mt-4">
          <ValidationRhPanel />
        </div>
        <div className="mt-6">
          <PaiementsPanel />
        </div>
        <div className="mt-6">
          <PipelineOverviewPanel />
        </div>

        <Reveal delay={40}>
          <h2 className="mt-12 border-t border-white/10 pt-8 font-display text-lg font-semibold text-white">
            Forum
          </h2>
        </Reveal>

        <Reveal delay={40}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">
              {editingId ? "Modifier le live" : "Nouveau live"}
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Titre
                </label>
                <input
                  value={form.titre}
                  onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                  placeholder="Ex. Vivre l'externalisation côté client"
                  className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Invité
                </label>
                <input
                  value={form.invite}
                  onChange={(e) => setForm((f) => ({ ...f, invite: e.target.value }))}
                  placeholder="Nom du client invité"
                  className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
            </div>

            <label className="mt-4 block font-mono text-xs uppercase tracking-widest text-white/50">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
            />

            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Date &amp; heure
                </label>
                <input
                  type="datetime-local"
                  value={form.startAtInput}
                  onChange={(e) => setForm((f) => ({ ...f, startAtInput: e.target.value }))}
                  className="mt-1 rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Durée (min)
                </label>
                <input
                  type="number"
                  min={15}
                  step={5}
                  value={form.dureeMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dureeMinutes: Math.max(15, Number(e.target.value)) }))
                  }
                  className="mt-1 w-24 rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                />
              </div>
              <Button
                variant="dark"
                onClick={save}
                disabled={!form.titre.trim() || !form.invite.trim() || status === "saving"}
              >
                {status === "saving" ? "Enregistrement..." : editingId ? "Mettre à jour" : "Planifier"}
              </Button>
              {editingId && (
                <Button variant="ghostDark" onClick={newLive}>
                  Annuler
                </Button>
              )}
            </div>
            {status === "error" && (
              <p className="mt-2 font-mono text-xs text-accent">Erreur — réessayer.</p>
            )}
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">Lives planifiés</h3>
            <div className="mt-4 space-y-2">
              {lives === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
              {lives === "erreur" && (
                <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>
              )}
              {Array.isArray(lives) && lives.length === 0 && (
                <p className="font-sans text-sm text-white/50">Aucun live pour l&apos;instant.</p>
              )}
              {Array.isArray(lives) &&
                lives.map((live) => (
                  <button
                    key={live.id}
                    onClick={() => editLive(live)}
                    className="flex w-full items-center justify-between rounded border border-white/10 bg-obsidian px-4 py-3 text-left transition-colors hover:border-accent/50"
                  >
                    <span>
                      <span className="block font-sans text-sm text-white">
                        {live.titre} — {live.invite}
                      </span>
                      <span className="block font-mono text-[11px] text-white/40">
                        {live.startAt
                          ? new Date(live.startAt).toLocaleString("fr-FR", {
                              dateStyle: "long",
                              timeStyle: "short",
                            })
                          : "Pas encore programmé"}
                        {live.dailyRoomName ? " · salle créée" : ""}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-accent">Modifier</span>
                  </button>
                ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
