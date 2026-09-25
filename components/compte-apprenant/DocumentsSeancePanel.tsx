"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet, apiGetBlob } from "@/lib/api";

interface SupportCoursApi {
  id: string;
  filename: string;
  seanceNumero: number | null;
  createdAt: string;
}

const POLL_MS = 20_000;

// Documents de la séance en cours, affichés à côté de la visio de
// l'apprenant — un exercice déposé par le formateur PENDANT le cours
// (panneau « Supports » de sa classe virtuelle) apparaît ici au prochain
// rafraîchissement, sans quitter l'appel. Les documents apparus depuis
// l'ouverture de la page sont signalés « Nouveau ».
export default function DocumentsSeancePanel({
  matricule,
  numero,
  onCount,
}: {
  matricule: string;
  numero: number;
  onCount?: (nbNouveaux: number) => void;
}) {
  const [docs, setDocs] = useState<SupportCoursApi[] | "loading" | "erreur">("loading");
  const vusAuDepart = useRef<Set<string> | null>(null);
  const [telechargement, setTelechargement] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    async function charger() {
      try {
        const all = await apiGet<SupportCoursApi[]>(`/apprenants/${matricule}/supports-cours`);
        if (cancelled) return;
        const seance = (all ?? []).filter((s) => s.seanceNumero === numero);
        if (!vusAuDepart.current) vusAuDepart.current = new Set(seance.map((s) => s.id));
        setDocs(seance);
        onCount?.(seance.filter((s) => !vusAuDepart.current!.has(s.id)).length);
      } catch {
        if (!cancelled) setDocs((prev) => (Array.isArray(prev) ? prev : "erreur"));
      }
      if (!cancelled) timeoutId = setTimeout(charger, POLL_MS);
    }
    charger();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matricule, numero]);

  async function ouvrir(s: SupportCoursApi) {
    setTelechargement(s.id);
    try {
      const blob = await apiGetBlob(`/apprenants/${matricule}/supports-cours/${s.id}`, {});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = s.filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } finally {
      setTelechargement(null);
    }
  }

  return (
    <div>
      <p className="font-sans text-xs text-white/50">
        Les exercices et documents partagés par votre formateur pendant le cours apparaissent ici
        automatiquement.
      </p>
      <div className="mt-3 space-y-2">
        {docs === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
        {docs === "erreur" && (
          <p className="font-sans text-sm text-white/50">Impossible de charger les documents.</p>
        )}
        {Array.isArray(docs) && docs.length === 0 && (
          <p className="font-sans text-sm text-white/50">Aucun document pour cette séance pour l&apos;instant.</p>
        )}
        {Array.isArray(docs) &&
          docs.map((s) => {
            const nouveau = !!vusAuDepart.current && !vusAuDepart.current.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => ouvrir(s)}
                className={`flex w-full items-center justify-between gap-3 rounded border px-3 py-2.5 text-left transition-colors hover:border-accent/60 ${
                  nouveau ? "border-accent bg-accent/10" : "border-white/10 bg-obsidian"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-sans text-sm text-white">{s.filename}</span>
                  {nouveau && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-accent">Nouveau</span>
                  )}
                </span>
                <span className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-white/50">
                  {telechargement === s.id ? "…" : "Ouvrir ↓"}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
