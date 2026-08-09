"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { apiGet, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface ProchaineSeance {
  groupeCle: string;
  numero: number;
  startAt: string;
}

interface RoomStatus {
  withinJoinWindow: boolean;
  configured: boolean;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

// "Lancer la Classe Virtuelle" de TeachColumn — résout la prochaine séance
// planifiée (toutes groupes confondus, cf. GET /formateurs/prochaine-seance)
// puis son état de fenêtre de rejoin, revérifié toutes les 60s.
export default function ClasseVirtuelleJoinButton() {
  const [seance, setSeance] = useState<ProchaineSeance | null | "loading" | "erreur">("loading");
  const [room, setRoom] = useState<RoomStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const next = await apiGet<ProchaineSeance | null>(
          "/formateurs/prochaine-seance",
          formateurHeaders()
        );
        if (cancelled) return;
        setSeance(next);
        if (next) {
          const status = await apiGet<RoomStatus>(
            `/seances/${next.groupeCle}/${next.numero}/room`,
            formateurHeaders()
          );
          if (!cancelled) setRoom(status);
        }
      } catch (err) {
        if (!cancelled) setSeance(err instanceof ApiError ? null : "erreur");
      }
    }

    fetchAll();
    const interval = setInterval(fetchAll, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (seance === "loading") {
    return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  }

  // Pas de bouton "Lancer" tant qu'il n'y a rien à lancer — juste
  // l'information, pour ne pas afficher une action qui ne mène nulle part.
  if (seance === "erreur" || seance === null) {
    return (
      <p className="font-sans text-sm text-white/50">Aucune classe virtuelle programmée.</p>
    );
  }

  if (room?.withinJoinWindow && room.configured) {
    return (
      <Button
        variant="dark"
        className="w-full justify-center"
        href={`/compte/formateur/classe-virtuelle/${seance.groupeCle}/${seance.numero}`}
      >
        Lancer la Classe Virtuelle
      </Button>
    );
  }

  return (
    <p className="font-sans text-sm text-white/50">
      Prochaine séance — Groupe {seance.groupeCle} {formatRelative(seance.startAt)}
    </p>
  );
}

function formatRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin <= 0) return "en cours";
  if (diffMin < 60) return `dans ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `dans ${diffH} h`;
  return `dans ${Math.round(diffH / 24)} j`;
}
