"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiUpload } from "@/lib/api";
import { entrepriseMatricule, fmtDate } from "./entrepriseApi";

interface Support {
  id: string;
  filename: string;
  mimeType: string;
  contratId: string | null;
  createdAt: string;
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const BTN = "rounded bg-accent px-4 py-2 font-sans text-sm font-semibold text-obsidian disabled:opacity-40";
const messageErreur = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue.");

// Supports de formation déposés par l'entreprise pour les agents de ses
// équipes — même pattern que SupportCours (formateur -> groupe), les agents
// concernés sont notifiés par e-mail au dépôt (voir
// EntreprisesComptesService.uploadSupportFormation).
export default function FormationEntreprise() {
  const [supports, setSupports] = useState<Support[] | "loading" | "erreur">("loading");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const matricule = entrepriseMatricule();

  const charger = useCallback(() => {
    if (!matricule) {
      setSupports("erreur");
      return;
    }
    apiGet<Support[]>(`/entreprises-comptes/${matricule}/supports-formation`).then(setSupports).catch(() => setSupports("erreur"));
  }, [matricule]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function uploader() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setErreur(null);
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiUpload(`/entreprises-comptes/${matricule}/supports-formation`, formData);
      if (fileRef.current) fileRef.current.value = "";
      charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {erreur && (
        <p className="rounded border border-statusRed/40 bg-statusRed/10 px-3 py-2 font-sans text-sm text-statusRed">{erreur}</p>
      )}

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Déposer un support de formation</h3>
        <p className="mt-1 font-sans text-xs text-white/50">
          PDF, Word, PowerPoint, vidéo (MP4/WEBM) ou audio (MP3/WAV) — 100 Mo max. Vos agents en poste sont notifiés par e-mail.
        </p>
        <input ref={fileRef} type="file" className="mt-3 font-sans text-sm text-white/80" />
        <button className={`${BTN} mt-3`} disabled={busy} onClick={uploader}>
          Déposer
        </button>
      </div>

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Supports déposés</h3>
        {supports === "loading" ? (
          <p className="mt-3 font-sans text-sm text-white/50">Chargement...</p>
        ) : supports === "erreur" ? (
          <p className="mt-3 font-sans text-sm text-white/50">Impossible de charger vos supports.</p>
        ) : supports.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-white/50">Aucun support déposé pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/5">
            {supports.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                <span className="font-sans text-sm text-white">{s.filename}</span>
                <span className="font-mono text-[11px] text-white/40">{fmtDate(s.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
