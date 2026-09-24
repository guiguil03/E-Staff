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
  dureeMinutes: number;
  objectifs: string | null;
  withinJoinWindow: boolean;
  configured: boolean;
  roomUrl: string | null;
  formateurEnLigne: boolean;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });
}

// Page plein écran de la classe virtuelle côté apprenant — le backend
// garde le contrôle de la fenêtre de rejoin (10 min avant → fin de
// séance) : roomUrl n'est renvoyée par l'API que si on est dedans, donc
// cette page ne peut pas être contournée en devinant une URL Daily.
//
// Hors fenêtre, la séance programmée par le formateur doit rester VISIBLE
// (date, durée, objectifs) : c'est la page ciblée par l'e-mail "Nouvelle
// séance programmée", et elle affichait jusqu'ici "Aucune classe virtuelle
// n'est disponible" dès qu'on n'était pas dans la fenêtre — l'apprenant
// concluait que la séance créée par le formateur n'existait pas (signalement
// du 2026-09-24). Elle revérifie aussi l'état régulièrement pour basculer
// seule sur la salle à l'ouverture de la fenêtre, sans rechargement manuel
// (auparavant chargée une seule fois au montage).
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

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function fetchStatus(m: string) {
      try {
        const data = await apiGet<RoomStatus | null>(`/apprenants/${m}/prochaine-seance-room`);
        if (cancelled) return;
        setStatus(data);
        setErreurDetail(null);
        // Une fois dans la salle (iframe affichée), on arrête de poller :
        // remplacer roomUrl (nouveau jeton à chaque appel) rechargerait
        // l'iframe et couperait la visio en cours.
        if (data?.withinJoinWindow && data.roomUrl) return;
        timeoutId = setTimeout(() => fetchStatus(m), data?.withinJoinWindow ? 15_000 : 30_000);
      } catch (err) {
        if (cancelled) return;
        setStatus("erreur");
        // Pas de nouvel essai sur une 401/403 (voir ClasseVirtuelleJoinButton).
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setErreurDetail("Votre session a expiré — reconnectez-vous.");
          return;
        }
        setErreurDetail(null);
        timeoutId = setTimeout(() => fetchStatus(m), 60_000);
      }
    }

    fetchStatus(matricule);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
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

  const retour = (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <Link
        href="/compte/apprenant/calendrier"
        className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
      >
        Voir le calendrier
      </Link>
      <Link
        href="/compte/apprenant"
        className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
      >
        ← Retour au tableau de bord
      </Link>
    </div>
  );

  // Séance programmée mais pas encore ouverte (ou salle pas encore prête) :
  // on l'affiche, avec l'heure d'ouverture de la salle.
  if (status && typeof status === "object" && status.startAt) {
    const opensAt = new Date(new Date(status.startAt).getTime() - 10 * 60 * 1000);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-obsidian px-4 text-center">
        <div className="w-full max-w-lg rounded border border-white/10 bg-obsidianCard p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Prochaine classe virtuelle</p>
          <h1 className="mt-2 font-display text-lg font-semibold text-white">
            Groupe {status.groupeCle} — Séance n°{status.numero}
          </h1>
          <p className="mt-3 font-sans text-sm text-white/80">
            {formatDateTime(status.startAt)} · {status.dureeMinutes} min
          </p>
          {status.objectifs && (
            <p className="mt-3 font-sans text-sm text-white/60">{status.objectifs}</p>
          )}
          <p className="mt-4 font-sans text-sm text-white/50">
            {status.withinJoinWindow
              ? status.configured
                ? "La salle est en cours de préparation — cette page s'ouvrira automatiquement."
                : "La visio n'est pas encore configurée pour cette séance."
              : `La salle ouvrira le ${formatDateTime(opensAt.toISOString())} (10 min avant le début) — cette page s'ouvrira automatiquement.`}
          </p>
        </div>
        {retour}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-obsidian px-4 text-center">
      <p className="font-sans text-sm text-white/60">
        {status === "erreur"
          ? erreurDetail ?? "Impossible de charger la classe virtuelle — réessayez."
          : "Aucune classe virtuelle programmée pour le moment."}
      </p>
      {retour}
    </div>
  );
}
