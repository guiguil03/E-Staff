"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface ApprenantMini {
  matricule: string;
  prenom: string;
  nom: string;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

// Une zone de note enregistrée automatiquement (1 s après la dernière frappe).
function NoteAutoSave({
  label,
  initial,
  onSave,
  rows = 3,
  placeholder,
}: {
  label: string;
  initial: string;
  onSave: (contenu: string) => Promise<void>;
  rows?: number;
  placeholder?: string;
}) {
  const [valeur, setValeur] = useState(initial);
  const [etat, setEtat] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  function changer(v: string) {
    setValeur(v);
    setEtat("idle");
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(async () => {
      setEtat("saving");
      try {
        await onSave(v);
        setEtat("saved");
      } catch {
        setEtat("error");
      }
    }, 1000);
  }

  return (
    <label className="block">
      <span className="flex items-center justify-between font-sans text-sm text-white">
        {label}
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          {etat === "saving" ? "Enregistrement..." : etat === "saved" ? "Enregistré" : etat === "error" ? "Échec — retapez" : ""}
        </span>
      </span>
      <textarea
        rows={rows}
        value={valeur}
        placeholder={placeholder}
        onChange={(e) => changer(e.target.value)}
        className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
      />
    </label>
  );
}

// Notes privées du formateur pendant la classe virtuelle (demande cliente
// du 2026-09-25 : « annotations ») — une note générale de séance et une
// note par apprenant, jamais visibles des apprenants. Enregistrées
// automatiquement, retrouvées à la prochaine ouverture.
export default function NotesFormateurPanel({
  groupe,
  seance,
  apprenants,
}: {
  groupe: string;
  seance: number;
  apprenants: ApprenantMini[];
}) {
  const [notes, setNotes] = useState<{ seance: string; apprenants: Record<string, string> } | "loading" | "erreur">(
    "loading"
  );

  useEffect(() => {
    apiGet<{ seance: string; apprenants: Record<string, string> }>(
      `/seances/${groupe}/${seance}/notes`,
      formateurHeaders()
    )
      .then(setNotes)
      .catch(() => setNotes("erreur"));
  }, [groupe, seance]);

  async function save(contenu: string, apprenantMatricule?: string) {
    await apiPut(
      `/seances/${groupe}/${seance}/notes`,
      { contenu, ...(apprenantMatricule ? { apprenantMatricule } : {}) },
      formateurHeaders()
    );
  }

  if (notes === "loading") return <p className="font-sans text-sm text-white/50">Chargement des notes...</p>;
  if (notes === "erreur") return <p className="font-sans text-sm text-white/50">Impossible de charger les notes.</p>;

  return (
    <div className="space-y-4">
      <p className="font-sans text-xs text-white/50">Notes privées — jamais visibles des apprenants.</p>
      <NoteAutoSave
        label="Notes de la séance"
        initial={notes.seance}
        rows={4}
        placeholder="Déroulé, points à reprendre la prochaine fois..."
        onSave={(c) => save(c)}
      />
      {apprenants.map((a) => (
        <NoteAutoSave
          key={a.matricule}
          label={`${a.prenom} ${a.nom}`}
          initial={notes.apprenants[a.matricule] ?? ""}
          rows={2}
          placeholder="Observation sur cet apprenant..."
          onSave={(c) => save(c, a.matricule)}
        />
      ))}
    </div>
  );
}
