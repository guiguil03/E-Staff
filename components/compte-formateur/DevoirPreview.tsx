"use client";

import { useEffect, useState } from "react";
import { apiGetBlob } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

const VIDEO_EXT = [".mp4", ".webm", ".mov", ".mkv"];
const AUDIO_EXT = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function hasExt(fileName: string | null, exts: string[]): boolean {
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return exts.some((ext) => lower.endsWith(ext));
}

// Devoir déposé par un apprenant (GET /notations/:id/devoir) — lu dans le
// navigateur (vidéo/audio) ou proposé au téléchargement (PDF, DOCX...).
// Partagé par « Évaluer & Corriger », la page « Noter » et le tableau
// Planning, pour que le formateur retrouve le rendu partout où il note.
export default function DevoirPreview({
  notationId,
  fileName,
}: {
  notationId: string;
  fileName: string | null;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    setUrl(null);
    setErreur(false);
    apiGetBlob(`/notations/${notationId}/devoir`, formateurHeaders())
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setErreur(true));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [notationId]);

  if (erreur) {
    return (
      <p className="mt-4 rounded border border-dashed border-white/15 px-4 py-3 font-sans text-sm text-white/50">
        Impossible de charger le fichier déposé.
      </p>
    );
  }
  if (!url) {
    return (
      <div className="mt-4 flex h-28 items-center justify-center rounded border border-dashed border-white/15 font-mono text-[11px] uppercase tracking-widest text-white/30">
        Chargement du fichier...
      </div>
    );
  }
  return (
    <div className="mt-4">
      {hasExt(fileName, VIDEO_EXT) && <video controls src={url} className="w-full rounded" />}
      {hasExt(fileName, AUDIO_EXT) && <audio controls src={url} className="w-full" />}
      <a
        href={url}
        download={fileName ?? undefined}
        className="mt-2 flex items-center justify-between rounded border border-white/15 bg-obsidian px-4 py-3 font-sans text-sm text-accent hover:border-accent/50"
      >
        <span className="truncate">{fileName ?? "Document déposé"}</span>
        <span className="ml-3 shrink-0 font-mono text-[11px] uppercase tracking-widest text-white/40">
          Télécharger →
        </span>
      </a>
    </div>
  );
}

// Bouton de téléchargement compact (tableau Planning) — ne récupère le
// fichier qu'au clic, pas pour chaque ligne au chargement de la page.
export function DevoirDownloadButton({
  notationId,
  fileName,
  className = "",
}: {
  notationId: string;
  fileName: string | null;
  className?: string;
}) {
  const [etat, setEtat] = useState<"idle" | "loading" | "erreur">("idle");

  async function download() {
    setEtat("loading");
    try {
      const blob = await apiGetBlob(`/notations/${notationId}/devoir`, formateurHeaders());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName ?? "devoir";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setEtat("idle");
    } catch {
      setEtat("erreur");
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={etat === "loading"}
      title={fileName ?? "Télécharger le devoir"}
      className={`font-mono text-[10px] uppercase tracking-widest hover:underline ${
        etat === "erreur" ? "text-red-400" : "text-white/50 hover:text-accent"
      } ${className}`}
    >
      {etat === "loading" ? "…" : etat === "erreur" ? "échec" : "↓ fichier"}
    </button>
  );
}
