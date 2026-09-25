"use client";

import { useState } from "react";
import { apiGet, ApiError } from "@/lib/api";

export interface EnregistrementApi {
  id: string;
  dureeSecondes: number | null;
  debutAt: string;
}

function formatDuree(s: number | null): string {
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

// Revisionnage des classes virtuelles enregistrées (Daily cloud recording).
// Le lien vidéo est temporaire : il n'est demandé qu'au clic, après
// vérification des droits côté backend (EnregistrementService), puis lu
// directement dans la page.
// Les enregistrements sont supprimés 90 jours après la séance (voir
// EnregistrementService.purgerAnciens côté backend).
const CONSERVATION_JOURS = 90;
function finConservation(debutAt: string): string {
  const fin = new Date(new Date(debutAt).getTime() + CONSERVATION_JOURS * 24 * 60 * 60 * 1000);
  return fin.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export default function EnregistrementsLecteur({
  enregistrements,
  lienPath,
  headers,
}: {
  enregistrements: EnregistrementApi[];
  /** Route backend renvoyant { url } pour un enregistrement. */
  lienPath: (id: string) => string;
  headers?: HeadersInit;
}) {
  const [lecture, setLecture] = useState<{ id: string; url: string } | null>(null);
  const [chargement, setChargement] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  if (enregistrements.length === 0) return null;

  async function lire(id: string) {
    setErreur(null);
    setChargement(id);
    try {
      const { url } = await apiGet<{ url: string }>(lienPath(id), headers);
      setLecture({ id, url });
    } catch (err) {
      setErreur(
        err instanceof ApiError && err.status === 401
          ? "Votre session a expiré — reconnectez-vous."
          : "Enregistrement momentanément indisponible — réessayez."
      );
    } finally {
      setChargement(null);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {enregistrements.map((e, i) => (
          <button
            key={e.id}
            type="button"
            onClick={() => lire(e.id)}
            disabled={chargement === e.id}
            className="inline-flex items-center gap-2 rounded border border-accent/50 px-3 py-1.5 font-sans text-xs text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
          >
            ▶ {enregistrements.length > 1 ? `Revoir (partie ${i + 1})` : "Revoir la séance"}
            {e.dureeSecondes ? <span className="text-white/50">{formatDuree(e.dureeSecondes)}</span> : null}
            {chargement === e.id && <span className="text-white/50">…</span>}
          </button>
        ))}
      </div>
      {enregistrements.length > 0 && (
        <p className="mt-1 font-sans text-[11px] text-white/40">
          Disponible jusqu&apos;au {finConservation(enregistrements[0].debutAt)}
        </p>
      )}
      {erreur && <p className="mt-2 font-sans text-xs text-accent">{erreur}</p>}
      {lecture && (
        <div className="mt-3">
          <video key={lecture.url} controls autoPlay src={lecture.url} className="w-full rounded bg-black" />
          <button
            type="button"
            onClick={() => setLecture(null)}
            className="mt-1 font-mono text-[11px] uppercase tracking-widest text-white/50 hover:text-accent"
          >
            Fermer la vidéo
          </button>
        </div>
      )}
    </div>
  );
}
