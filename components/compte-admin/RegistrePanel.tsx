"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface RegistreRow {
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  statut: string;
  formation: string;
  dateAdmission: string | null;
  derniereMissionClient: string | null;
}

interface Vague {
  id: string;
  label: string;
}

const emptyCreationForm = { prenom: "", nom: "", email: "", groupeId: "" };

// Registre global des agents & apprenants — traçabilité et unicité des
// matricules (section 3 du cahier des charges RH). Filtre en mémoire, pas
// de pagination côté back : mêmes volumes que le Cockpit Formateur (~30
// apprenants), voir cockpit.service.ts pour le précédent.
export default function RegistrePanel() {
  const [rows, setRows] = useState<RegistreRow[] | "loading" | "erreur">("loading");
  const [filter, setFilter] = useState("");
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyCreationForm);
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "success">("idle");

  function refreshRows() {
    apiGet<RegistreRow[]>("/rh/registre", adminHeaders())
      .then(setRows)
      .catch(() => setRows("erreur"));
  }

  useEffect(refreshRows, []);

  useEffect(() => {
    apiGet<Vague[]>("/rh/vagues", adminHeaders())
      .then(setVagues)
      .catch(() => {});
  }, []);

  async function createApprenant() {
    if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim() || !form.groupeId) return;
    setStatus("saving");
    try {
      await apiPostAuthed(
        "/rh/apprenants",
        {
          prenom: form.prenom.trim(),
          nom: form.nom.trim(),
          email: form.email.trim(),
          groupeId: form.groupeId,
        },
        adminHeaders()
      );
      setForm(emptyCreationForm);
      setStatus("success");
      refreshRows();
    } catch {
      setStatus("error");
    }
  }

  const filtered = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.matricule, r.prenom, r.nom, r.email, r.formation, r.statut]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, filter]);

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-white">
            Registre global des agents &amp; apprenants
          </h3>
          <div className="flex items-center gap-3">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrer..."
              className="w-full max-w-xs rounded border border-white/20 bg-obsidian px-3 py-1.5 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
            />
            <button
              onClick={() => {
                setOpen((o) => !o);
                setStatus("idle");
              }}
              className="whitespace-nowrap font-mono text-xs uppercase tracking-widest text-accent hover:underline"
            >
              {open ? "Fermer" : "+ Créer un compte apprenant"}
            </button>
          </div>
        </div>

        {open && (
          <div className="mt-4 rounded border border-white/10 bg-obsidian p-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Prénom
                </label>
                <input
                  value={form.prenom}
                  onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Nom
                </label>
                <input
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  E-mail
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                  Groupe
                </label>
                <select
                  value={form.groupeId}
                  onChange={(e) => setForm((f) => ({ ...f, groupeId: e.target.value }))}
                  className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                >
                  <option value="">— Choisir —</option>
                  {vagues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Button
                variant="dark"
                onClick={createApprenant}
                disabled={
                  status === "saving" ||
                  !form.prenom.trim() ||
                  !form.nom.trim() ||
                  !form.email.trim() ||
                  !form.groupeId
                }
              >
                {status === "saving" ? "Création..." : "Créer le compte"}
              </Button>
              {status === "error" && (
                <p className="font-mono text-xs text-accent">Erreur — vérifiez les champs.</p>
              )}
              {status === "success" && (
                <p className="font-mono text-xs text-success">
                  Compte créé — identifiants envoyés par e-mail.
                </p>
              )}
            </div>
          </div>
        )}

        {rows === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {rows === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}

        {Array.isArray(rows) && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-widest text-white/40">
                  <th className="py-2 pr-4">Matricule</th>
                  <th className="py-2 pr-4">Nom &amp; Prénom</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Formation</th>
                  <th className="py-2 pr-4">Date admission</th>
                  <th className="py-2 pr-4">Dernière mission (Client)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.matricule}
                    className="border-b border-white/5 font-sans text-sm text-white/80 hover:bg-white/5"
                  >
                    <td className="py-2.5 pr-4 font-mono text-xs text-accent">
                      <Link href={`/compte/admin/apprenants/${r.matricule}`} className="hover:underline">
                        {r.matricule}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4">
                      {r.prenom} {r.nom}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                          r.statut === "En Production"
                            ? "border-accent/40 text-accent"
                            : r.statut === "Certifié"
                              ? "border-success/40 text-success"
                              : "border-white/20 text-white/50"
                        }`}
                      >
                        {r.statut}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">{r.formation}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-white/50">
                      {r.dateAdmission
                        ? new Date(r.dateAdmission).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-white/40">
                      {r.derniereMissionClient ?? "—"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center font-sans text-sm text-white/40">
                      Aucun résultat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Reveal>
  );
}
