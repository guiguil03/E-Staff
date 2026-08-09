"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface RoomStatus {
  startAt: string | null;
  withinJoinWindow: boolean;
  configured: boolean;
}

// Ligne "Rejoindre la salle de classe virtuelle" de QuickActions — seul
// morceau de la carte branché sur le vrai backend (classe-virtuelle
// module) ; le reste de la carte (titre de séance, countdown) continue de
// venir de exampleData.ts, sujet distinct. Revérifie l'état toutes les 60s
// pour que le bouton s'active tout seul en entrant dans la fenêtre de
// rejoin, sans que l'apprenant ait à recharger la page.
export default function ClasseVirtuelleJoinButton() {
  const [status, setStatus] = useState<RoomStatus | null | "loading" | "erreur">("loading");

  useEffect(() => {
    const matricule = sessionStorage.getItem(ACCOUNT_MATRICULE_KEY);
    if (!matricule) {
      setStatus("erreur");
      return;
    }

    let cancelled = false;
    async function fetchStatus(m: string) {
      try {
        const data = await apiGet<RoomStatus | null>(`/apprenants/${m}/prochaine-seance-room`);
        if (!cancelled) setStatus(data);
      } catch (err) {
        if (!cancelled) setStatus(err instanceof ApiError ? null : "erreur");
      }
    }

    fetchStatus(matricule);
    const interval = setInterval(() => fetchStatus(matricule), 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const infoClass =
    "flex items-center justify-between rounded border border-dashed border-white/15 px-4 py-3 font-sans text-sm text-white/50";

  if (status === "loading") {
    return <div className={infoClass}>Classe virtuelle — chargement...</div>;
  }

  // Rien à afficher tant qu'aucune séance n'est programmée — pas de
  // libellé "Rejoindre" trompeur pour une action qui n'existe pas encore.
  if (status === "erreur" || status === null) {
    return <div className={infoClass}>Aucune classe virtuelle programmée pour le moment.</div>;
  }

  // Le lien "Rejoindre" n'apparaît que dans la fenêtre de rejoin (10 min
  // avant → fin de séance) — en dehors, on informe juste du délai, sans
  // afficher un bouton d'action inactif.
  if (status.withinJoinWindow && status.configured) {
    return (
      <Link
        href="/compte/apprenant/classe-virtuelle"
        className="flex items-center justify-between rounded border border-accent/30 bg-obsidian px-4 py-3 font-sans text-sm text-white transition-colors hover:border-accent"
      >
        Rejoindre la salle de classe virtuelle
        <span aria-hidden="true" className="text-accent">
          →
        </span>
      </Link>
    );
  }

  if (status.withinJoinWindow) {
    return <div className={infoClass}>Classe virtuelle — configuration en cours.</div>;
  }

  return (
    <div className={infoClass}>
      Prochaine classe virtuelle {status.startAt ? formatRelative(status.startAt) : ""}
    </div>
  );
}

function formatRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin <= 0) return "bientôt";
  if (diffMin < 60) return `dans ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `dans ${diffH} h`;
  return `dans ${Math.round(diffH / 24)} j`;
}
