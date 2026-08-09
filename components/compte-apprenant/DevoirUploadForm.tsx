"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { apiUpload } from "@/lib/api";

interface DevoirUploadFormProps {
  matricule: string;
  numero: number;
  competence: string;
  existingFileName?: string | null;
  onUploaded: () => void;
}

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

  async function submit() {
    if (!file) return;
    setStatus("uploading");
    try {
      const formData = new FormData();
      formData.append("fichier", file);
      await apiUpload(`/apprenants/${matricule}/notations/${numero}/${competence}/devoir`, formData);
      setStatus("idle");
      setFile(null);
      onUploaded();
    } catch {
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
          MP4, WEBM, MP3, WAV, DOCX, PDF...
        </span>
        <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>

      <div className="mt-4">
        <Button variant="dark" onClick={submit} disabled={!file || status === "uploading"}>
          {status === "uploading" ? "Envoi..." : "Envoyer mon devoir"}
        </Button>
        {status === "error" && (
          <p className="mt-2 font-mono text-xs text-accent">Erreur — réessayer.</p>
        )}
      </div>
    </div>
  );
}
