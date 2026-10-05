"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ReactionButton from "./ReactionButton";
import ShareButton from "./ShareButton";
import { LockIcon, PlusCircleIcon } from "./CommunityIcons";
import type { MediaPostPublic } from "./mediaPost";
import { apiGet, apiPost } from "@/lib/api";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

// Mémorise les posts déjà likés par CE navigateur (clé locale, pas un vrai
// compte) — purement pour que l'état visuel reste cohérent au rechargement.
// N'empêche personne de re-liker depuis un autre navigateur/navigation
// privée : la vraie protection anti-abus est le rate-limit par IP côté
// backend (voir media-wall.controller.ts).
const LIKED_POSTS_KEY = "estaf-media-posts-liked";

function getLikedPostIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(LIKED_POSTS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function setPostLiked(id: string, liked: boolean) {
  if (typeof window === "undefined") return;
  try {
    const ids = getLikedPostIds();
    if (liked) ids.add(id);
    else ids.delete(id);
    window.localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify([...ids]));
  } catch {
    // Stockage indisponible (navigation privée stricte, quota...) — tant
    // pis, l'état visuel ne survivra juste pas au rechargement.
  }
}

function HangingPin() {
  return (
    <div aria-hidden="true" className="mx-auto hidden w-px flex-col items-center sm:flex">
      <span className="h-6 w-px bg-accent/40" />
      <span className="-mt-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
    </div>
  );
}

interface MediaWallProps {
  /** Masque le titre/intro (le h2 "Photos & vidéos de l'équipe" et le
   * bandeau "prévisualisation avant publication") quand un parent porte
   * déjà son propre titre pour cette section — voir StudioMetier.tsx. Par
   * défaut affiché (ex. CommunautePage.tsx). */
  showHeading?: boolean;
}

// Le mur de médias publiés par la RH pour /offres/carrieres (et
// /communaute, en pause depuis le 2026-09-26) — univers sombre/élite
// (obsidienne + or), cartes "photo accrochée". Publication directe par la
// RH (voir compte-admin/MediaWallPanel.tsx), pas de modération.
export default function MediaWall({ showHeading = true }: MediaWallProps) {
  const [posts, setPosts] = useState<MediaPostPublic[] | null>(null);

  useEffect(() => {
    apiGet<MediaPostPublic[]>("/media-posts")
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]));
  }, []);

  return (
    <div aria-labelledby={showHeading ? "medias-equipe" : undefined}>
      {showHeading && (
        <>
          <Reveal>
            <h2
              id="medias-equipe"
              className="font-display text-2xl font-bold text-accent sm:text-3xl"
            >
              Photos &amp; vidéos de l&apos;équipe
            </h2>
            <p className="mt-2 max-w-2xl font-sans text-sm text-white/60">
              Photos et vidéos de l&apos;équipe, moments forts des campagnes, portraits de nos
              leaders et de nos formateurs.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-4 inline-flex items-center gap-2 rounded border border-accent/25 bg-obsidianCard px-4 py-2 font-sans text-xs text-white/60">
              <LockIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
              Chaque contenu partagé par la communauté passe par une prévisualisation avant
              publication.
            </div>
          </Reveal>
        </>
      )}

      {posts === null && (
        <p className="mt-8 font-sans text-sm text-white/50">Chargement des médias...</p>
      )}
      {posts !== null && posts.length === 0 && (
        <p className="mt-8 font-sans text-sm text-white/50">Aucun média publié pour le moment.</p>
      )}

      {posts !== null && posts.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 60}>
              <div className="flex flex-col items-center">
                <HangingPin />
                <article className="relative mt-1 w-full overflow-hidden rounded-lg border-2 border-accent/60 bg-obsidianCard shadow-lg shadow-black/40">
                  {post.type === "video" ? (
                    <video
                      src={`${API_URL}/media-posts/${post.id}/file`}
                      controls
                      className="h-36 w-full bg-black object-cover"
                    />
                  ) : (
                    <img
                      src={`${API_URL}/media-posts/${post.id}/file`}
                      alt={post.caption ?? "Photo de l'équipe e-Staf"}
                      className="h-36 w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <p className="flex-1 font-sans text-sm text-white/85">{post.caption ?? ""}</p>
                    {post.auteur && (
                      <p className="mt-3 font-mono text-xs text-white/40">
                        Publié par {post.auteur}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <ReactionButton
                        initialCount={post.likes}
                        initialActive={getLikedPostIds().has(post.id)}
                        label={`Réagir à la publication${post.auteur ? ` de ${post.auteur}` : ""}`}
                        onToggle={async (active) => {
                          setPostLiked(post.id, active);
                          try {
                            const result = await apiPost<{ likes: number }>(
                              `/media-posts/${post.id}/${active ? "like" : "unlike"}`,
                              {}
                            );
                            return result.likes;
                          } catch {
                            // Panne réseau/serveur — le compteur local optimiste reste
                            // affiché tel quel, pas de rollback (cosmétique, pas critique).
                          }
                        }}
                      />
                      <Link
                        href="/connexion"
                        className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-obsidian/60 px-3 py-1.5 font-sans text-xs font-medium text-white/70 transition-colors duration-150 hover:border-accent hover:text-accent"
                      >
                        <LockIcon className="h-3.5 w-3.5" />
                        Commenter
                      </Link>
                      <ShareButton
                        label={`Partager la publication${post.auteur ? ` de ${post.auteur}` : ""}`}
                        onShare={() => {
                          apiPost(`/media-posts/${post.id}/share`, {}).catch(() => {});
                        }}
                      />
                    </div>
                  </div>
                </article>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <Reveal delay={120}>
        <div className="mx-auto mt-14 flex max-w-xl flex-col items-center gap-3 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-white/50">
            Importer vos souvenirs
          </p>
          <div className="relative">
            <button
              type="button"
              disabled
              aria-hidden="true"
              tabIndex={-1}
              className="flex h-16 w-16 cursor-not-allowed items-center justify-center rounded-full border-2 border-accent bg-accent/10 text-accent opacity-70"
            >
              <PlusCircleIcon className="h-8 w-8" />
            </button>
          </div>
          <p className="font-sans text-sm text-white/60">
            Joindre des photos ou vidéos (pour validation)
          </p>
          <p className="font-mono text-xs text-white/40">
            Formats JPG, PNG ou MP4 — sera examiné avant publication.
          </p>

          <div className="relative mt-2 w-full">
            <input
              type="file"
              disabled
              aria-hidden="true"
              tabIndex={-1}
              className="block w-full cursor-not-allowed rounded border border-accent/20 bg-obsidian px-3 py-2 font-sans text-sm text-white/40 opacity-50"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center gap-2 rounded bg-obsidian/80 backdrop-blur-[1px]"
            >
              <LockIcon className="h-4 w-4 text-accent" />
              <span className="font-sans text-xs font-medium text-white/85">
                Connectez-vous pour importer
              </span>
            </div>
          </div>

          <Link
            href="/connexion"
            className="mt-2 inline-flex items-center justify-center rounded-full border border-accent bg-accent px-6 py-2.5 font-sans text-sm font-medium text-obsidian transition-colors duration-150 hover:bg-accent/90"
          >
            Se connecter pour publier
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
