"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";

interface AnnonceApi {
  id: string;
  message: string;
  createdAt: string;
  formateur: { prenom: string; nom: string };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

interface AnnoncesCardProps {
  matricule: string;
  className?: string;
}

// Annonces diffusées par le formateur (voir CockpitService.createDiffusion
// et BroadcastCard.tsx) — jusqu'ici la diffusion n'existait pas du tout côté
// backend, rien n'arrivait ici.
export default function AnnoncesCard({ matricule, className }: AnnoncesCardProps) {
  const [annonces, setAnnonces] = useState<AnnonceApi[] | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<AnnonceApi[]>(`/apprenants/${matricule}/annonces`)
      .then(setAnnonces)
      .catch(() => setAnnonces("erreur"));
  }, [matricule]);

  return (
    <Reveal className={className}>
      <div className="h-full rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">Annonces</h3>
        <div className="mt-3 space-y-2">
          {annonces === "loading" && (
            <p className="font-sans text-xs text-white/50">Chargement...</p>
          )}
          {annonces === "erreur" && (
            <p className="font-sans text-xs text-white/50">Impossible de charger les annonces.</p>
          )}
          {Array.isArray(annonces) && annonces.length === 0 && (
            <p className="font-sans text-xs text-white/50">Aucune annonce pour l&apos;instant.</p>
          )}
          {Array.isArray(annonces) &&
            annonces.map((a) => (
              <div key={a.id} className="rounded border border-white/10 bg-obsidian p-3">
                <p className="font-sans text-sm text-white/80">{a.message}</p>
                <p className="mt-1 font-mono text-[11px] text-white/40">
                  {a.formateur.prenom} {a.formateur.nom} · {fmtDate(a.createdAt)}
                </p>
              </div>
            ))}
        </div>
      </div>
    </Reveal>
  );
}
