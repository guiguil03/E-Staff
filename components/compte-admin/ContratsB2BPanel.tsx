"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface Contrat {
  id: string;
  clientNom: string;
  description: string | null;
  dateDebut: string;
  dateFin: string | null;
  statut: string;
  tarifMensuel: number | null;
  _count: { missions: number };
}

const STATUT_LABELS: Record<string, string> = {
  actif: "Actif",
  termine: "Terminé",
  suspendu: "Suspendu",
};

const emptyForm = { clientNom: "", description: "", dateDebut: "", tarifMensuel: "" };

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// Casier des contrats B2B — le client (nom, description, dates, tarif) sur
// lequel les missions (voir MissionsPanel) viennent se rattacher. Le statut
// se change directement depuis la liste (pas de formulaire séparé) puisque
// c'est le seul champ modifié fréquemment une fois le contrat créé.
export default function ContratsB2BPanel() {
  const [contrats, setContrats] = useState<Contrat[] | "loading" | "erreur">("loading");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function refresh() {
    setContrats("loading");
    apiGet<Contrat[]>("/production/contrats", adminHeaders())
      .then(setContrats)
      .catch(() => setContrats("erreur"));
  }

  useEffect(refresh, []);

  async function create() {
    if (!form.clientNom.trim() || !form.dateDebut) return;
    setStatus("saving");
    setError(null);
    try {
      await apiPostAuthed(
        "/production/contrats",
        {
          clientNom: form.clientNom.trim(),
          description: form.description.trim() || undefined,
          dateDebut: new Date(form.dateDebut).toISOString(),
          tarifMensuel: form.tarifMensuel ? Number(form.tarifMensuel) : undefined,
        },
        adminHeaders()
      );
      setForm(emptyForm);
      setOpen(false);
      setStatus("idle");
      refresh();
    } catch {
      setStatus("error");
      setError("Erreur — vérifiez les champs.");
    }
  }

  async function changeStatut(c: Contrat, statut: string) {
    setSavingId(c.id);
    try {
      await apiPut(
        `/production/contrats/${c.id}`,
        {
          clientNom: c.clientNom,
          description: c.description ?? undefined,
          dateDebut: c.dateDebut,
          dateFin: c.dateFin,
          statut,
          tarifMensuel: c.tarifMensuel,
        },
        adminHeaders()
      );
      refresh();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-white">Contrats B2B</h3>
          <button
            onClick={() => setOpen((o) => !o)}
            className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
          >
            {open ? "Fermer" : "+ Ajouter un contrat"}
          </button>
        </div>

        {open && (
          <div className="mt-4 rounded border border-white/10 bg-obsidian p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Client
                </label>
                <input
                  value={form.clientNom}
                  onChange={(e) => setForm((f) => ({ ...f, clientNom: e.target.value }))}
                  placeholder="Nom de l'entreprise cliente"
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Tarif mensuel
                </label>
                <input
                  type="number"
                  value={form.tarifMensuel}
                  onChange={(e) => setForm((f) => ({ ...f, tarifMensuel: e.target.value }))}
                  placeholder="Ex. 3000000"
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Date de début
                </label>
                <input
                  type="date"
                  value={form.dateDebut}
                  onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))}
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Description
                </label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ex. Squad commerciale — 5 postes"
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="mt-3">
              <Button
                variant="dark"
                onClick={create}
                disabled={status === "saving" || !form.clientNom.trim() || !form.dateDebut}
              >
                {status === "saving" ? "Création..." : "Créer le contrat"}
              </Button>
            </div>
            {error && <p className="mt-2 font-mono text-xs text-accent">{error}</p>}
          </div>
        )}

        {contrats === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {contrats === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}
        {Array.isArray(contrats) && contrats.length === 0 && (
          <p className="mt-4 font-sans text-sm text-white/50">Aucun contrat pour l&apos;instant.</p>
        )}

        {Array.isArray(contrats) && contrats.length > 0 && (
          <div className="mt-4 space-y-2">
            {contrats.map((c) => (
              <div key={c.id} className="rounded border border-white/10 bg-obsidian px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/compte/admin/contrats/${c.id}`}
                      className="font-sans text-sm text-white hover:text-accent hover:underline"
                    >
                      {c.clientNom}
                    </Link>
                    <p className="font-mono text-[11px] text-white/40">
                      {fmtDate(c.dateDebut)} → {fmtDate(c.dateFin)} ·{" "}
                      {c._count.missions} mission{c._count.missions > 1 ? "s" : ""}
                      {c.tarifMensuel && ` · ${c.tarifMensuel.toLocaleString("fr-FR")}/mois`}
                    </p>
                    {c.description && (
                      <p className="mt-1 font-sans text-xs text-white/50">{c.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {(["actif", "suspendu", "termine"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => changeStatut(c, s)}
                        disabled={savingId === c.id}
                        className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 ${
                          c.statut === s
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-white/15 text-white/50 hover:border-white/30"
                        }`}
                      >
                        {STATUT_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}
