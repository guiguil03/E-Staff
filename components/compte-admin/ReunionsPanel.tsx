"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface Reunion {
  id: string;
  titre: string;
  description: string | null;
  audience: "equipe" | "partenaires" | "tous";
  participants: string; // JSON string[]
  startAt: string;
  dureeMinutes: number;
  lieu: string | null;
  statut: "planifiee" | "annulee";
  createdAt: string;
}

const AUDIENCE_LABELS: Record<Reunion["audience"], string> = {
  equipe: "Équipe interne",
  partenaires: "Partenaires",
  tous: "Équipe + Partenaires",
};

const emptyForm = {
  titre: "",
  description: "",
  audience: "equipe" as Reunion["audience"],
  participantsInput: "",
  startAtInput: "",
  dureeMinutes: 60,
  lieu: "",
};

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseParticipants(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Réunions convoquées par la RH — demande explicite de Ravaka : "il faut que
// la RH PUISSE convoquer une réunion, que ce soit pour l'équipe, les
// partenaires, et c'est elle qui gère le tout". Pas de salle vidéo intégrée
// pour l'instant (contrairement à ForumLive/Seance qui utilisent Daily.co) —
// juste planification + suivi + annulation, avec un champ `lieu` libre pour
// un lien de visio externe si besoin. Même pattern CRUD que
// AdminDashboard's Forum live scheduling (create/update via upsert, liste
// triée par date).
export default function ReunionsPanel() {
  const [reunions, setReunions] = useState<Reunion[] | "loading" | "erreur">("loading");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  function refresh() {
    setReunions("loading");
    apiGet<Reunion[]>("/rh/reunions", adminHeaders())
      .then(setReunions)
      .catch(() => setReunions("erreur"));
  }

  useEffect(refresh, []);

  function newReunion() {
    setEditingId(null);
    setForm(emptyForm);
    setStatus("idle");
  }

  function editReunion(r: Reunion) {
    setEditingId(r.id);
    setForm({
      titre: r.titre,
      description: r.description ?? "",
      audience: r.audience,
      participantsInput: parseParticipants(r.participants).join(", "),
      startAtInput: toDatetimeLocalValue(r.startAt),
      dureeMinutes: r.dureeMinutes,
      lieu: r.lieu ?? "",
    });
    setStatus("idle");
  }

  async function save() {
    if (!form.titre.trim() || !form.startAtInput) return;
    setStatus("saving");
    try {
      const payload = {
        titre: form.titre,
        description: form.description || undefined,
        audience: form.audience,
        participants: form.participantsInput
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        startAt: new Date(form.startAtInput).toISOString(),
        dureeMinutes: form.dureeMinutes,
        lieu: form.lieu || undefined,
      };
      if (editingId) {
        await apiPut(`/rh/reunions/${editingId}`, payload, adminHeaders());
      } else {
        await apiPostAuthed("/rh/reunions", payload, adminHeaders());
      }
      newReunion();
      refresh();
    } catch {
      setStatus("error");
    }
  }

  async function cancelReunion(id: string) {
    if (!window.confirm("Annuler cette réunion ?")) return;
    await apiPostAuthed(`/rh/reunions/${id}/annuler`, {}, adminHeaders());
    refresh();
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">
            {editingId ? "Modifier la réunion" : "Convoquer une réunion"}
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                Titre
              </label>
              <input
                value={form.titre}
                onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                placeholder="Ex. Point mensuel équipe pédagogique"
                className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                Audience
              </label>
              <select
                value={form.audience}
                onChange={(e) =>
                  setForm((f) => ({ ...f, audience: e.target.value as Reunion["audience"] }))
                }
                className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
              >
                <option value="equipe">Équipe interne</option>
                <option value="partenaires">Partenaires</option>
                <option value="tous">Équipe + Partenaires</option>
              </select>
            </div>
          </div>

          <label className="mt-4 block font-mono text-xs uppercase tracking-widest text-white/50">
            Description / ordre du jour
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
          />

          <label className="mt-4 block font-mono text-xs uppercase tracking-widest text-white/50">
            Participants (noms ou e-mails, séparés par des virgules)
          </label>
          <input
            value={form.participantsInput}
            onChange={(e) => setForm((f) => ({ ...f, participantsInput: e.target.value }))}
            placeholder="Ex. Claire Fontaine, formateur.martin@e-staf.mg"
            className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
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
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                Lieu / lien de visio
              </label>
              <input
                value={form.lieu}
                onChange={(e) => setForm((f) => ({ ...f, lieu: e.target.value }))}
                placeholder="Ex. Salle 2 ou lien Meet"
                className="mt-1 w-56 rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
              />
            </div>
            <Button
              variant="dark"
              onClick={save}
              disabled={!form.titre.trim() || !form.startAtInput || status === "saving"}
            >
              {status === "saving"
                ? "Enregistrement..."
                : editingId
                  ? "Mettre à jour"
                  : "Convoquer la réunion"}
            </Button>
            {editingId && (
              <Button variant="ghostDark" onClick={newReunion}>
                Annuler la modification
              </Button>
            )}
          </div>
          {status === "error" && (
            <p className="mt-2 font-mono text-xs text-accent">Erreur — réessayer.</p>
          )}
        </div>
      </Reveal>

      <Reveal delay={40}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Réunions planifiées</h3>
          <div className="mt-4 space-y-2">
            {reunions === "loading" && (
              <p className="font-sans text-sm text-white/50">Chargement...</p>
            )}
            {reunions === "erreur" && (
              <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>
            )}
            {Array.isArray(reunions) && reunions.length === 0 && (
              <p className="font-sans text-sm text-white/50">Aucune réunion planifiée.</p>
            )}
            {Array.isArray(reunions) &&
              reunions.map((r) => {
                const participants = parseParticipants(r.participants);
                return (
                  <div
                    key={r.id}
                    className={`rounded border px-4 py-3 ${
                      r.statut === "annulee"
                        ? "border-white/5 bg-obsidian opacity-50"
                        : "border-white/10 bg-obsidian"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-sans text-sm text-white">
                          {r.titre}
                          {r.statut === "annulee" && (
                            <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-accent">
                              Annulée
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-white/40">
                          {new Date(r.startAt).toLocaleString("fr-FR", {
                            dateStyle: "long",
                            timeStyle: "short",
                          })}{" "}
                          · {r.dureeMinutes} min · {AUDIENCE_LABELS[r.audience]}
                          {r.lieu ? ` · ${r.lieu}` : ""}
                        </p>
                        {participants.length > 0 && (
                          <p className="mt-1 font-sans text-xs text-white/50">
                            Participants : {participants.join(", ")}
                          </p>
                        )}
                      </div>
                      {r.statut === "planifiee" && (
                        <div className="flex shrink-0 gap-3">
                          <button
                            onClick={() => editReunion(r)}
                            className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => cancelReunion(r.id)}
                            className="font-mono text-xs uppercase tracking-widest text-white/40 hover:text-accent"
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
