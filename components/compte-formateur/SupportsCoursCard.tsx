"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { apiDelete, apiGet, apiUpload, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface SupportCoursApi {
  id: string;
  filename: string;
  seanceNumero: number | null;
  createdAt: string;
}

interface SupportsCoursCardProps {
  groupeKey: string;
  seance: number;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

// Supports de cours partagés aux apprenants du groupe — soit un document
// général (visible tout le temps), soit rattaché à la séance actuellement
// sélectionnée sur la page Planning (décision produit 2026-09-22 : le
// formateur choisit l'un ou l'autre au dépôt). Distinct de
// FichesPreparationPanel.tsx (dépôt personnel du formateur, jamais visible
// des apprenants).
export default function SupportsCoursCard({ groupeKey, seance }: SupportsCoursCardProps) {
  const [supports, setSupports] = useState<SupportCoursApi[] | "loading" | "erreur">("loading");
  const [file, setFile] = useState<File | null>(null);
  const [scope, setScope] = useState<"seance" | "general">("seance");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  function reload() {
    if (!groupeKey) return;
    setSupports("loading");
    apiGet<SupportCoursApi[]>(`/supports-cours?groupeCle=${groupeKey}`, formateurHeaders())
      .then(setSupports)
      .catch(() => setSupports("erreur"));
  }

  useEffect(reload, [groupeKey]);

  async function submit() {
    if (!file || !groupeKey) return;
    setStatus("uploading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const params = new URLSearchParams({ groupeCle: groupeKey });
      if (scope === "seance") params.set("seanceNumero", String(seance));
      await apiUpload(`/supports-cours?${params.toString()}`, formData, formateurHeaders());
      setStatus("idle");
      setFile(null);
      reload();
    } catch (err) {
      setStatus("error");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  async function remove(id: string) {
    try {
      await apiDelete(`/supports-cours/${id}`, formateurHeaders());
      reload();
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    }
  }

  return (
    <div className="mt-4 rounded border border-white/15 px-4 py-4">
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-white/80">Supports de cours du groupe</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded border border-dashed border-white/20 px-3 py-2 text-xs text-white/60 hover:border-accent/50">
          {file ? file.name : "Choisir un fichier"}
          <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as "seance" | "general")}
          className="rounded border border-white/20 bg-obsidian px-2 py-2 font-mono text-xs text-white outline-none focus:border-accent"
        >
          <option value="seance">Pour la séance n°{seance}</option>
          <option value="general">Document général du groupe</option>
        </select>
        <Button variant="ghostDark" onClick={submit} disabled={!file || status === "uploading"}>
          {status === "uploading" ? "Envoi..." : "Déposer"}
        </Button>
        {status === "error" && <p className="font-mono text-xs text-accent">Erreur — réessayer.</p>}
      </div>

      <div className="mt-4 space-y-1.5">
        {supports === "loading" && <p className="font-sans text-xs text-white/40">Chargement...</p>}
        {supports === "erreur" && (
          <p className="font-sans text-xs text-white/40">Impossible de charger les supports.</p>
        )}
        {Array.isArray(supports) && supports.length === 0 && (
          <p className="font-sans text-xs text-white/40">Aucun support déposé pour l&apos;instant.</p>
        )}
        {Array.isArray(supports) &&
          supports.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded border border-white/10 bg-obsidian px-3 py-2"
            >
              <span className="font-sans text-xs text-white">
                {s.filename}
                <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-white/30">
                  {s.seanceNumero !== null ? `Séance ${s.seanceNumero}` : "Général"} — {fmtDate(s.createdAt)}
                </span>
              </span>
              <button
                onClick={() => remove(s.id)}
                className="font-mono text-xs text-white/40 hover:text-accent"
                aria-label="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
