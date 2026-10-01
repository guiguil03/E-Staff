"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet, apiGetBlob, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface SupportCoursApi {
  id: string;
  filename: string;
  seanceNumero: number | null;
  createdAt: string;
  mimeType: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

function SupportRow({ s, matricule }: { s: SupportCoursApi; matricule: string }) {
  async function download() {
    const blob = await apiGetBlob(`/apprenants/${matricule}/supports-cours/${s.id}`, {}).catch(
      () => null
    );
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = s.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="flex w-full items-center justify-between rounded border border-white/10 bg-obsidian p-3 text-left hover:border-accent/40"
    >
      <span className="font-sans text-sm text-white">{s.filename}</span>
      <span className="font-mono text-[11px] text-white/40">{fmtDate(s.createdAt)}</span>
    </button>
  );
}

// Supports de cours déposés par le formateur, visibles depuis le compte
// apprenant — remplace le "Bientôt disponible" de QuickActions
// (décision produit 2026-09-22). Section "générale" (documents non liés à
// une séance précise) en haut, puis groupé par séance.
export default function SupportsCoursPage() {
  const checked = useRequireRole("apprenant");
  const [supports, setSupports] = useState<SupportCoursApi[] | "loading" | "erreur">("loading");
  const [matricule, setMatricule] = useState<string | null>(null);

  useEffect(() => {
    if (!checked) return;
    const m = sessionStorage.getItem(ACCOUNT_MATRICULE_KEY);
    if (!m) {
      setSupports("erreur");
      return;
    }
    setMatricule(m);
    apiGet<SupportCoursApi[]>(`/apprenants/${m}/supports-cours`)
      .then(setSupports)
      .catch((err) => setSupports(err instanceof ApiError ? [] : "erreur"));
  }, [checked]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  const generaux = Array.isArray(supports) ? supports.filter((s) => s.seanceNumero === null) : [];
  const parSeance = new Map<number, SupportCoursApi[]>();
  if (Array.isArray(supports)) {
    for (const s of supports) {
      if (s.seanceNumero === null) continue;
      const list = parSeance.get(s.seanceNumero) ?? [];
      list.push(s);
      parSeance.set(s.seanceNumero, list);
    }
  }
  const numeros = Array.from(parSeance.keys()).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/compte/apprenant"
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour au tableau de bord
        </Link>

        <Reveal>
          <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            Supports de cours
          </h1>
        </Reveal>

        {supports === "loading" && (
          <p className="mt-6 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {supports === "erreur" && (
          <p className="mt-6 font-sans text-sm text-white/50">
            Impossible de charger les supports de cours pour le moment.
          </p>
        )}

        {Array.isArray(supports) && supports.length === 0 && (
          <p className="mt-6 font-sans text-sm text-white/50">
            Aucun support déposé par votre formateur pour l&apos;instant.
          </p>
        )}

        {Array.isArray(supports) && matricule && (
          <>
            <Reveal delay={40}>
              <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
                <h3 className="font-display text-base font-semibold text-white">
                  Documents généraux du groupe
                </h3>
                <div className="mt-3 space-y-2">
                  {generaux.length === 0 && (
                    <p className="font-sans text-xs text-white/50">Aucun document général.</p>
                  )}
                  {generaux.map((s) => (
                    <SupportRow key={s.id} s={s} matricule={matricule} />
                  ))}
                </div>
              </div>
            </Reveal>

            {numeros.map((numero, i) => (
              <Reveal key={numero} delay={80 + i * 20}>
                <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
                  <h3 className="font-display text-base font-semibold text-white">
                    Séance n°{numero}
                  </h3>
                  <div className="mt-3 space-y-2">
                    {(parSeance.get(numero) ?? []).map((s) => (
                      <SupportRow key={s.id} s={s} matricule={matricule} />
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
