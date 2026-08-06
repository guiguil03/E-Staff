"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import type { UploadCompetencyEntry } from "../planningGradesStore";

interface UploadCompetencyFormProps {
  initialEntry?: UploadCompetencyEntry;
  onSave: (entry: UploadCompetencyEntry) => void;
  onCancel: () => void;
}

// Compréhension orale/écrite ne sont pas notées par grille de critères :
// l'apprenant dépose un document (audio/texte), le formateur l'écoute/lit
// puis note directement /20. Dépôt local uniquement (nom de fichier gardé
// en state) — pas de backend de stockage pour ce module, cf. gradingGrids.ts.
export default function UploadCompetencyForm({
  initialEntry,
  onSave,
  onCancel,
}: UploadCompetencyFormProps) {
  const [fileName, setFileName] = useState<string | null>(initialEntry?.fileName ?? null);
  const [note, setNote] = useState<number | "">(initialEntry?.note ?? "");

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-white/20 px-4 py-8 text-center hover:border-accent/50">
        <span className="font-sans text-sm text-white/70">
          {fileName ?? "Déposer le document de l'apprenant"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
          PDF, audio, vidéo
        </span>
        <input
          type="file"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>

      <label className="mt-5 block font-sans text-sm text-white" htmlFor="upload-note">
        Note
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          id="upload-note"
          type="number"
          min={0}
          max={20}
          value={note}
          onChange={(e) =>
            setNote(e.target.value === "" ? "" : Math.max(0, Math.min(20, Number(e.target.value))))
          }
          className="w-24 rounded border border-white/20 bg-obsidian px-3 py-2 text-center font-sans text-sm text-white outline-none focus:border-accent"
        />
        <span className="font-mono text-xs text-white/40">/ 20</span>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          variant="dark"
          onClick={() => note !== "" && onSave({ kind: "upload", fileName, note, scoreOn20: note })}
          disabled={note === ""}
        >
          Enregistrer la note
        </Button>
        <Button variant="ghostDark" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
