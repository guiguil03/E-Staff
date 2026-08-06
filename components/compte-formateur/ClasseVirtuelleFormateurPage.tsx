"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface RoomStatus {
  groupeCle: string;
  numero: number;
  withinJoinWindow: boolean;
  configured: boolean;
  roomUrl: string | null;
}

interface ClasseVirtuelleFormateurPageProps {
  groupeCle: string;
  numero: number;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

export default function ClasseVirtuelleFormateurPage({
  groupeCle,
  numero,
}: ClasseVirtuelleFormateurPageProps) {
  const checked = useRequireRole("formateur");
  const [status, setStatus] = useState<RoomStatus | "loading" | "erreur">("loading");

  useEffect(() => {
    if (!checked) return;
    apiGet<RoomStatus>(`/seances/${groupeCle}/${numero}/room`, formateurHeaders())
      .then(setStatus)
      .catch((err) => setStatus(err instanceof ApiError ? "erreur" : "erreur"));
  }, [checked, groupeCle, numero]);

  if (!checked || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  if (status !== "erreur" && status.withinJoinWindow && status.roomUrl) {
    return (
      <div className="flex h-screen flex-col bg-obsidian">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="font-sans text-sm text-white/70">
            Groupe {groupeCle} — Séance n°{numero}
          </p>
          <Link
            href="/compte/formateur"
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
        {status !== "erreur" && !status.configured
          ? "La visio n'est pas encore configurée pour cette séance."
          : "Cette classe virtuelle n'est pas disponible pour le moment."}
      </p>
      <Link
        href="/compte/formateur"
        className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
      >
        ← Retour au cockpit
      </Link>
    </div>
  );
}
