"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface RoomStatus {
  groupeCle: string;
  numero: number;
  startAt: string | null;
  withinJoinWindow: boolean;
  configured: boolean;
  roomUrl: string | null;
}

// Page plein écran de la classe virtuelle côté apprenant — le backend
// garde le contrôle de la fenêtre de rejoin (10 min avant → fin de
// séance) : roomUrl n'est renvoyée par l'API que si on est dedans, donc
// cette page ne peut pas être contournée en devinant une URL Daily.
export default function ClasseVirtuelleApprenantPage() {
  const checked = useRequireRole("apprenant");
  const [status, setStatus] = useState<RoomStatus | null | "loading" | "erreur">("loading");
  const [erreurDetail, setErreurDetail] = useState<string | null>(null);

  // Une 401/403 (session expirée, matricule qui ne correspond plus à la
  // session signée) ne doit jamais s'afficher comme "rien de prévu" — ça
  // masquait une vraie panne d'authentification derrière un état qui a
  // l'air normal (voir signalement du 2026-09-22).
  useEffect(() => {
    if (!checked) return;
    const matricule = sessionStorage.getItem(ACCOUNT_MATRICULE_KEY);
    if (!matricule) {
      setStatus("erreur");
      return;
    }
    apiGet<RoomStatus | null>(`/apprenants/${matricule}/prochaine-seance-room`)
      .then(setStatus)
      .catch((err) => {
        setStatus("erreur");
        setErreurDetail(
          err instanceof ApiError && (err.status === 401 || err.status === 403)
            ? "Votre session a expiré — reconnectez-vous."
            : null
        );
      });
  }, [checked]);

  if (!checked || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/70">Chargement...</p>
      </div>
    );
  }

  if (status && typeof status === "object" && status.withinJoinWindow && status.roomUrl) {
    return (
      <div className="flex h-screen flex-col bg-obsidian">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="font-sans text-sm text-white/70">Groupe {status.groupeCle} — Séance n°{status.numero}</p>
          <Link
            href="/compte/apprenant"
            className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
          >
            ← Quitter
          </Link>
        </div>
        <iframe
          src={status.roomUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full flex-1 border-0"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-obsidian px-4 text-center">
      <p className="font-sans text-sm text-white/60">
        {status === "erreur"
          ? erreurDetail ?? "Impossible de charger la classe virtuelle — réessayez."
          : status && typeof status === "object" && !status.configured
            ? "La visio n'est pas encore configurée pour cette séance."
            : "Aucune classe virtuelle n'est disponible pour le moment."}
      </p>
      <Link
        href="/compte/apprenant"
        className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
      >
        ← Retour au tableau de bord
      </Link>
    </div>
  );
}
