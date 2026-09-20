"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiGetBlob, apiUpload } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface FichesPreparationPanelProps {
  onClose: () => void;
}

interface DocumentApi {
  id: string;
  filename: string;
  createdAt: string;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

// Fiches de préparation — supports que le formateur compte utiliser en
// séance, déposés librement (pas rattachés à une vague/séance précise).
// Consultables ensuite depuis le Casier Formateur côté RH (voir
// FormateurCasierPanel.tsx et RhService.getFormateurCasier).
export default function FichesPreparationPanel({ onClose }: FichesPreparationPanelProps) {
  const [documents, setDocuments] = useState<DocumentApi[] | "loading" | "erreur">("loading");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  function reload() {
    setDocuments("loading");
    apiGet<DocumentApi[]>("/cockpit/documents", formateurHeaders())
      .then(setDocuments)
      .catch(() => setDocuments("erreur"));
  }

  useEffect(reload, []);

  async function submit() {
    if (!file) return;
    setStatus("uploading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiUpload("/cockpit/documents", formData, formateurHeaders());
      setStatus("idle");
      setFile(null);
      reload();
    } catch {
      setStatus("error");
    }
  }

  async function download(doc: DocumentApi) {
    const blob = await apiGetBlob(`/cockpit/documents/${doc.id}`, formateurHeaders()).catch(
      () => null
    );
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Reveal>
      <div className="rounded border border-accent/30 bg-obsidianCard p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-white">
            Mes fiches de préparation
          </h3>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent"
          >
            Fermer ✕
          </button>
        </div>
        <p className="mt-1 font-sans text-xs text-white/60">
          Déposez les supports que vous comptez utiliser en séance — visibles ensuite dans votre
          Casier côté RH.
        </p>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-white/20 px-4 py-8 text-center hover:border-accent/50">
          <span className="font-sans text-sm text-white/70">
            {file ? file.name : "Déposer une fiche de préparation"}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
            PDF, Word, PowerPoint
          </span>
          <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <div className="mt-3">
          <Button variant="dark" onClick={submit} disabled={!file || status === "uploading"}>
            {status === "uploading" ? "Envoi..." : "Déposer la fiche"}
          </Button>
          {status === "error" && (
            <p className="mt-2 font-mono text-xs text-accent">Erreur — réessayer.</p>
          )}
        </div>

        <div className="mt-5 space-y-2">
          {documents === "loading" && (
            <p className="font-sans text-xs text-white/50">Chargement...</p>
          )}
          {documents === "erreur" && (
            <p className="font-sans text-xs text-white/50">Impossible de charger vos fiches.</p>
          )}
          {Array.isArray(documents) && documents.length === 0 && (
            <p className="font-sans text-xs text-white/50">Aucune fiche déposée pour l&apos;instant.</p>
          )}
          {Array.isArray(documents) &&
            documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => download(doc)}
                className="flex w-full items-center justify-between rounded border border-white/10 bg-obsidian p-3 text-left hover:border-accent/40"
              >
                <span className="font-sans text-sm text-white">{doc.filename}</span>
                <span className="font-mono text-[11px] text-white/40">{fmtDate(doc.createdAt)}</span>
              </button>
            ))}
        </div>
      </div>
    </Reveal>
  );
}
