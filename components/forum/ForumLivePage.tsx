"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";

interface LiveRoomStatus {
  titre: string;
  invite: string;
  startAt: string | null;
  withinJoinWindow: boolean;
  configured: boolean;
  roomUrl: string | null;
}

// Page de visionnage du Live du Forum — pas de useRequireRole ici (la page
// elle-même n'est pas démontée en cas de refus, voir ForumAccessGate pour
// le filtre UX), mais `GET /forum/live/room` est maintenant protégée
// côté serveur (ApprenantOuAdminGuard) : un visiteur sans session
// apprenant/admin reçoit un 401, traité ici comme "aucun live disponible"
// plutôt que d'exposer qu'il s'agit d'un refus d'accès. Si le visiteur est
// connecté en Admin, le backend lui renvoie un jeton hôte (caméra/micro)
// plutôt qu'un jeton spectateur (owner_only_broadcast côté Daily gère
// automatiquement la distinction) — le cookie de session part
// automatiquement avec l'appel (`credentials: "include"`, voir lib/api.ts).
export default function ForumLivePage() {
  const [status, setStatus] = useState<LiveRoomStatus | null | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<LiveRoomStatus | null>("/forum/live/room")
      .then(setStatus)
      .catch((err) => setStatus(err instanceof ApiError ? null : "erreur"));
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  if (status && typeof status === "object" && status.withinJoinWindow && status.roomUrl) {
    return (
      <div className="flex h-screen flex-col bg-obsidian">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="font-sans text-sm text-white/70">
            {status.titre} — avec {status.invite}
          </p>
          <Link
            href="/forum"
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
        {status && typeof status === "object" && !status.configured
          ? "La diffusion n'est pas encore configurée pour ce live."
          : "Aucun live n'est disponible pour le moment."}
      </p>
      <Link
        href="/forum"
        className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
      >
        ← Retour au Forum
      </Link>
    </div>
  );
}
