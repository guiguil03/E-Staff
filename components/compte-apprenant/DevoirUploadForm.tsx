"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { apiUpload, ApiError } from "@/lib/api";

interface DevoirUploadFormProps {
  matricule: string;
  numero: number;
  competence: string;
  existingFileName?: string | null;
  onUploaded: () => void;
}

const MAX_DEVOIR_BYTES = 200 * 1024 * 1024;

// Dépôt de devoir apprenant (vidéo/audio pour l'oral, texte pour l'écrit)
// pour une compétence à grille d'une séance donnée — alimente directement
// la file "Évaluer & Corriger" du formateur (même ligne Notation).
export default function DevoirUploadForm({
  matricule,
  numero,
  competence,
  existingFileName,
  onUploaded,
}: DevoirUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [erreur, setErreur] = useState<string | null>(null);

  async function submit() {
    if (!file) return;
    // Même limite que le backend (NotationController, 200 Mo) — évite
    // d'attendre la fin d'un long envoi pour apprendre qu'il est refusé.
    if (file.size > MAX_DEVOIR_BYTES) {
      setErreur("Fichier trop volumineux (200 Mo maximum).");
      setStatus("error");
      return;
    }
    setErreur(null);
    setStatus("uploading");
    try {
      const formData = new FormData();
      formData.append("fichier", file);
      await apiUpload(`/apprenants/${matricule}/notations/${numero}/${competence}/devoir`, formData);
      setStatus("idle");
      setFile(null);
      onUploaded();
    } catch (err) {
      // Message réel du backend (séance non planifiée, fichier trop gros,
      // session expirée...) plutôt qu'un « Erreur » générique.
      setErreur(
        err instanceof ApiError && err.status === 401
          ? "Votre session a expiré — reconnectez-vous."
          : err instanceof ApiError && err.status === 413
            ? "Fichier trop volumineux (200 Mo maximum)."
            : err instanceof ApiError
              ? err.message
              : "Envoi impossible — vérifiez votre connexion et réessayez."
      );
      setStatus("error");
    }
  }

  return (
    <div>
      {existingFileName && (
        <p className="font-sans text-sm text-white/60">
          Déjà déposé : <span className="text-white">{existingFileName}</span> — en attente de
          correction. Déposer un nouveau fichier remplacera celui-ci.
        </p>
      )}
      <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-white/20 px-4 py-8 text-center hover:border-accent/50">
        <span className="font-sans text-sm text-white/70">
          {file ? file.name : "Déposer votre devoir (vidéo, audio ou texte)"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
          MP4, WEBM, MP3, WAV, DOCX, PDF... — 200 Mo max
        </span>
        <input
          type="file"
          className="sr-only"
          accept="video/*,audio/*,.pdf,.doc,.docx,.odt,.txt"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setStatus("idle");
            setErreur(null);
          }}
        />
      </label>

      <div className="mt-4">
        <Button variant="dark" onClick={submit} disabled={!file || status === "uploading"}>
          {status === "uploading" ? "Envoi..." : "Envoyer mon devoir"}
        </Button>
        {status === "error" && (
          <p className="mt-2 font-sans text-xs text-accent">{erreur ?? "Erreur — réessayer."}</p>
        )}
      </div>
    </div>
  );
}
