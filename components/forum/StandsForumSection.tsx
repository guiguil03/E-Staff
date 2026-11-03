"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet, ApiError } from "@/lib/api";

interface StandPublic {
  id: string;
  nom: string;
  presentation: string | null;
  offresTexte: string | null;
  entreprise: { raisonSociale: string };
}

// Branché sur GET /entreprises-comptes/public/stands (public, statut
// "publie" uniquement) — stands virtuels des entreprises clientes au forum,
// édités depuis leur Espace Entreprise (voir LiveEtForum.tsx).
export default function StandsForumSection() {
  const [stands, setStands] = useState<StandPublic[] | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<StandPublic[]>("/entreprises-comptes/public/stands")
      .then(setStands)
      .catch((err) => setStands(err instanceof ApiError ? [] : "erreur"));
  }, []);

  if (stands === "erreur" || (Array.isArray(stands) && stands.length === 0)) return null;

  return (
    <div aria-labelledby="forum-stands" className="mt-16">
      <Reveal>
        <h2 id="forum-stands" className="font-display text-2xl font-bold text-accent sm:text-3xl">
          Stands du forum virtuel
        </h2>
        <p className="mt-2 max-w-2xl font-sans text-sm text-white/60">
          Nos entreprises clientes présentent leur activité et leurs offres pendant le forum virtuel.
        </p>
      </Reveal>

      {stands === "loading" ? (
        <div className="mt-6 rounded border border-dashed border-accent/30 bg-obsidianCard px-6 py-10 text-center">
          <p className="font-sans text-sm text-white/50">Chargement...</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {stands.map((s, i) => (
            <Reveal key={s.id} delay={i * 60}>
              <div className="rounded border border-accent/30 bg-obsidianCard p-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">{s.entreprise.raisonSociale}</p>
                <p className="mt-2 font-display text-lg font-semibold text-white">{s.nom}</p>
                {s.presentation && <p className="mt-2 font-sans text-sm text-white/70">{s.presentation}</p>}
                {s.offresTexte && (
                  <p className="mt-3 whitespace-pre-line font-sans text-xs text-white/60">{s.offresTexte}</p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
