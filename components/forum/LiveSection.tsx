"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import AuthGate from "@/components/communaute/AuthGate";
import { CommentIcon, LockIcon } from "@/components/communaute/CommunityIcons";
import { apiGet, ApiError } from "@/lib/api";

interface ProchainLive {
  id: string;
  titre: string;
  invite: string;
  description: string | null;
  startAt: string | null;
  dureeMinutes: number;
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

// Branché sur GET /forum/live/prochain (public) — remplace le placeholder
// statique "Aucun live programmé" par le vrai prochain live planifié
// depuis l'Espace Admin, quand il y en a un.
export default function LiveSection() {
  const [live, setLive] = useState<ProchainLive | null | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<ProchainLive | null>("/forum/live/prochain")
      .then(setLive)
      .catch((err) => setLive(err instanceof ApiError ? null : "erreur"));
  }, []);

  return (
    <div aria-labelledby="forum-live">
      <Reveal>
        <h2 id="forum-live" className="font-display text-2xl font-bold text-accent sm:text-3xl">
          Le Live du mois
        </h2>
        <p className="mt-2 max-w-2xl font-sans text-sm text-white/60">
          Chaque mois, un client e-Staf prend la parole en direct pour
          partager son expérience et son domaine d&apos;activité.
        </p>
      </Reveal>

      <Reveal delay={80}>
        {live === "loading" && (
          <div className="mt-6 rounded border border-dashed border-accent/30 bg-obsidianCard px-6 py-16 text-center">
            <p className="font-sans text-sm text-white/50">Chargement...</p>
          </div>
        )}

        {(live === "erreur" || live === null) && (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded border border-dashed border-accent/30 bg-obsidianCard px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold text-white">
              Aucun live programmé pour le moment
            </p>
            <p className="max-w-sm font-sans text-sm text-white/60">
              Le premier Forum e-Staf est en préparation. Revenez bientôt pour
              découvrir la date et l&apos;invité du mois.
            </p>
          </div>
        )}

        {live && typeof live === "object" && (
          <div className="mt-6 rounded border border-accent/30 bg-obsidianCard p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              {live.startAt ? formatRelative(live.startAt) : "Date à venir"}
            </p>
            <p className="mt-2 font-display text-xl font-semibold text-white">{live.titre}</p>
            <p className="mt-1 font-sans text-sm text-accent">Avec {live.invite}</p>
            {live.description && (
              <p className="mt-3 font-sans text-sm text-white/70">{live.description}</p>
            )}
            {live.startAt && (
              <p className="mt-3 font-mono text-xs text-white/40">
                {new Date(live.startAt).toLocaleString("fr-FR", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
            )}
            <Link
              href="/forum/live"
              className="mt-4 inline-flex items-center gap-2 rounded border border-accent/30 bg-obsidian px-4 py-2.5 font-sans text-sm text-white transition-colors hover:border-accent"
            >
              Voir le live
              <span aria-hidden="true" className="text-accent">
                →
              </span>
            </Link>
          </div>
        )}
      </Reveal>

      <Reveal delay={140}>
        <div className="mt-8">
          <div className="flex items-center gap-2 font-sans text-sm font-medium text-accent">
            <CommentIcon className="h-4 w-4" />
            Commentaires du live
          </div>
          <div className="mt-3 flex items-center gap-2 rounded border border-accent/25 bg-obsidianCard px-4 py-3 font-sans text-xs text-white/60">
            <LockIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
            Les commentaires s&apos;ouvrent pendant la diffusion du live.
          </div>
          <AuthGate
            message="Connectez-vous pour rejoindre le live et échanger en direct avec nos clients."
            className="mt-3"
          />
        </div>
      </Reveal>
    </div>
  );
}
