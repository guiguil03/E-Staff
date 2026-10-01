"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface RoomStatus {
  startAt: string | null;
  withinJoinWindow: boolean;
  configured: boolean;
  // Le formateur est réellement connecté à la salle (voir
  // ClasseVirtuelleService.computeRoomStatus, alimenté par le webhook Daily)
  // — sert l'alerte sonore ci-dessous, distincte de withinJoinWindow qui ne
  // reflète que l'heure programmée.
  formateurEnLigne: boolean;
}

// Signal sonore (Web Audio, pas de fichier à charger) joué au moment où le
// formateur vient de rejoindre — demandé par la cliente ("que ça sonne de
// leur côté") en complément de l'e-mail immédiat déjà envoyé
// (PresenceService.notifierClasseDemarree). Ne marche que si l'apprenant a
// déjà interagi avec la page (règle navigateur sur l'audio automatique) ;
// échoue silencieusement sinon, la bannière visuelle reste le filet de
// sécurité.
function playAlertSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    [0, 0.18, 0.36].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = i % 2 === 0 ? 880 : 660;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.15);
    });
  } catch {
    // Web Audio indisponible (contexte pas encore autorisé, navigateur trop
    // ancien...) — la bannière visuelle suffit, pas d'erreur bloquante.
  }
}

// Ligne "Rejoindre la salle de classe virtuelle" de QuickActions — seul
// morceau de la carte branché sur le vrai backend (classe-virtuelle
// module) ; le reste de la carte (titre de séance, countdown) continue de
// venir de exampleData.ts, sujet distinct. Revérifie l'état régulièrement
// pour que le bouton s'active tout seul en entrant dans la fenêtre de
// rejoin, et pour détecter le vrai démarrage (formateurEnLigne) sans que
// l'apprenant ait à recharger la page — poll resserré (15s) une fois dans
// la fenêtre, relâché (60s) en dehors.
export default function ClasseVirtuelleJoinButton() {
  const [status, setStatus] = useState<RoomStatus | null | "loading" | "erreur">("loading");
  const [erreurDetail, setErreurDetail] = useState<string | null>(null);
  const wasLiveRef = useRef(false);

  useEffect(() => {
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
        if (data?.formateurEnLigne && !wasLiveRef.current) {
          playAlertSound();
        }
        wasLiveRef.current = Boolean(data?.formateurEnLigne);
        setStatus(data);
        setErreurDetail(null);
        if (!cancelled) {
          timeoutId = setTimeout(() => fetchStatus(m), data?.withinJoinWindow ? 15_000 : 60_000);
        }
      } catch (err) {
        if (cancelled) return;
        // Une 401/403 (session expirée, matricule qui ne correspond plus à
        // la session) ne doit JAMAIS s'afficher comme "rien de prévu" — ce
        // masquage cachait une vraie panne d'authentification derrière un
        // état qui a l'air normal (voir signalement du 2026-09-22).
        // Pas de nouvel essai sur une 401/403 : la session ne se répare pas
        // toute seule, et chaque échec compte dans le verrouillage
        // anti-brute-force par IP côté backend (voir apprenant.guard.ts).
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setStatus("erreur");
          setErreurDetail("Votre session a expiré — reconnectez-vous.");
          return;
        }
        setStatus("erreur");
        setErreurDetail(null);
        timeoutId = setTimeout(() => fetchStatus(m), 60_000);
      }
    }

    fetchStatus(matricule);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const infoClass =
    "flex items-center justify-between rounded border border-dashed border-white/15 px-4 py-3 font-sans text-sm text-white/50";

  if (status === "loading") {
    return <div className={infoClass}>Classe virtuelle — chargement...</div>;
  }

  // Rien à afficher tant qu'aucune séance n'est programmée — pas de
  // libellé "Rejoindre" trompeur pour une action qui n'existe pas encore.
  // Distinct d'une vraie erreur (réseau/session expirée) depuis le
  // 2026-09-22 : les deux affichaient avant le même message, masquant une
  // panne d'authentification derrière un état qui a l'air normal.
  if (status === null) {
    return <div className={infoClass}>Aucune classe virtuelle programmée pour le moment.</div>;
  }
  if (status === "erreur") {
    return (
      <div className={infoClass}>{erreurDetail ?? "Impossible de charger la classe virtuelle — réessayez."}</div>
    );
  }

  // Le lien "Rejoindre" n'apparaît que dans la fenêtre de rejoin (10 min
  // avant → fin de séance) — en dehors, on informe juste du délai, sans
  // afficher un bouton d'action inactif. Mis en avant (pulse + libellé "En
  // direct") dès que le formateur est réellement connecté.
  if (status.withinJoinWindow && status.configured) {
    return (
      <Link
        href="/compte/apprenant/classe-virtuelle"
        className={`flex items-center justify-between rounded border px-4 py-3 font-sans text-sm text-white transition-colors ${
          status.formateurEnLigne
            ? "animate-pulse border-accent bg-accent/10 hover:bg-accent/20"
            : "border-accent/30 bg-obsidian hover:border-accent"
        }`}
      >
        <span>
          {status.formateurEnLigne && (
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent align-middle" />
          )}
          {status.formateurEnLigne
            ? "Votre classe a commencé — rejoindre"
            : "Rejoindre la salle de classe virtuelle"}
        </span>
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
