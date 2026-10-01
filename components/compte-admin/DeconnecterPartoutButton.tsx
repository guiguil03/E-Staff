"use client";

import { useState } from "react";
import { apiPostAuthed } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

// Admin/RH : coupe toutes les sessions ouvertes d'un formateur ou d'un
// apprenant (appareil perdu, départ...) — audit du 2026-09-28.
export default function DeconnecterPartoutButton({ matricule }: { matricule: string }) {
  const [etat, setEtat] = useState<"idle" | "confirm" | "saving" | "done" | "erreur">("idle");

  async function confirmer() {
    setEtat("saving");
    try {
      await apiPostAuthed(`/auth/revoquer-sessions/${encodeURIComponent(matricule)}`, {}, adminHeaders());
      setEtat("done");
    } catch {
      setEtat("erreur");
    }
  }

  const base =
    "whitespace-nowrap rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest disabled:opacity-50";
  if (etat === "done") return <span className="font-mono text-[11px] uppercase tracking-widest text-statusGreen">Sessions coupées</span>;
  if (etat === "confirm" || etat === "saving") {
    return (
      <span className="flex items-center gap-2">
        <button onClick={confirmer} disabled={etat === "saving"} className={`${base} border-statusRed/60 bg-statusRed/10 text-statusRed`}>
          {etat === "saving" ? "..." : "Confirmer"}
        </button>
        <button onClick={() => setEtat("idle")} className="font-mono text-[11px] uppercase tracking-widest text-white/50 hover:text-accent">
          Annuler
        </button>
      </span>
    );
  }
  return (
    <button
      onClick={() => setEtat("confirm")}
      className={`${base} border-statusRed/40 text-statusRed hover:bg-statusRed/10`}
      title="Coupe toutes ses sessions ouvertes, sur tous ses appareils"
    >
      {etat === "erreur" ? "Échec — réessayer" : "Déconnecter partout"}
    </button>
  );
}
