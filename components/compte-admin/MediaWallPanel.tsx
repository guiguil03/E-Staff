"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiDelete, apiGet, apiPut, apiUpload, ApiError } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

interface MediaPostRh {
  id: string;
  type: "photo" | "video";
  caption: string | null;
  auteur: string | null;
  publiee: boolean;
  createdAt: string;
}

const EMPTY_FORM = { caption: "", auteur: "" };

// Portail RH — médias (photos/vidéos) publiés directement sur le Mur des
// Performances de la page carrières, aux côtés des offres d'emploi
// (OffresEmploiPanel). Publication directe, pas de file de modération :
// l'admin dépose le fichier et c'est en ligne, modifiable/masquable ensuite.
export default function MediaWallPanel() {
  const [posts, setPosts] = useState<MediaPostRh[] | "loading" | "erreur">("loading");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function refresh() {
    setPosts("loading");
    apiGet<MediaPostRh[]>("/rh/media-posts", adminHeaders())
      .then(setPosts)
      .catch(() => setPosts("erreur"));
  }

  useEffect(refresh, []);

  // Prévisualisation locale avant envoi — révoque l'URL précédente à chaque
  // changement de fichier ou au démontage, pour ne pas fuiter de mémoire.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function publier() {
    if (!file) return;
    setUploading(true);
    setErreur(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (form.caption.trim()) formData.append("caption", form.caption.trim());
      if (form.auteur.trim()) formData.append("auteur", form.auteur.trim());
      await apiUpload("/rh/media-posts", formData, adminHeaders());
      setFile(null);
      setForm(EMPTY_FORM);
      refresh();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Publication impossible — réessayez.");
    } finally {
      setUploading(false);
    }
  }

  async function togglePublie(post: MediaPostRh) {
    setErreur(null);
    try {
      await apiPut(`/rh/media-posts/${post.id}`, { publiee: !post.publiee }, adminHeaders());
      refresh();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Action impossible — réessayez.");
    }
  }

  async function supprimer(post: MediaPostRh) {
    if (!window.confirm("Supprimer ce média ? Cette action est définitive.")) return;
    setErreur(null);
    try {
      await apiDelete(`/rh/media-posts/${post.id}`, adminHeaders());
      refresh();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Suppression impossible — réessayez.");
    }
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">Médias</h3>
        <p className="mt-1 font-sans text-xs text-white/50">
          Photos et vidéos affichées sur la page carrières (/offres/carrieres) — publication
          immédiate, sans validation.
        </p>

        {erreur && <p className="mt-3 font-sans text-sm text-accent">{erreur}</p>}

        <div className="mt-4 grid gap-4 rounded border border-white/10 bg-obsidian p-4 lg:grid-cols-[1fr_200px]">
          <div className="space-y-3">
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                Fichier (photo ou vidéo)
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none file:mr-3 file:rounded file:border-0 file:bg-accent/20 file:px-3 file:py-1 file:text-accent focus:border-accent"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                Légende
              </label>
              <input
                type="text"
                value={form.caption}
                onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                Publié par (optionnel)
              </label>
              <input
                type="text"
                value={form.auteur}
                onChange={(e) => setForm((f) => ({ ...f, auteur: e.target.value }))}
                className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
              />
            </div>
            <Button variant="dark" disabled={!file || uploading} onClick={publier}>
              {uploading ? "Publication..." : "Publier"}
            </Button>
          </div>

          <div className="flex items-center justify-center rounded border border-dashed border-white/15 bg-obsidianCard p-2">
            {previewUrl ? (
              file?.type.startsWith("video/") ? (
                <video src={previewUrl} controls className="max-h-40 w-full rounded" />
              ) : (
                <img src={previewUrl} alt="Aperçu" className="max-h-40 w-full rounded object-cover" />
              )
            ) : (
              <p className="text-center font-mono text-[11px] text-white/30">Aperçu</p>
            )}
          </div>
        </div>

        {posts === "loading" && <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>}
        {posts === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}
        {Array.isArray(posts) && posts.length === 0 && (
          <p className="mt-4 font-sans text-sm text-white/50">Aucun média publié pour le moment.</p>
        )}

        {Array.isArray(posts) && posts.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <div key={post.id} className="rounded border border-white/10 bg-obsidian p-3">
                {post.type === "video" ? (
                  <video
                    src={`${API_URL}/rh/media-posts/${post.id}/file`}
                    controls
                    className="h-36 w-full rounded object-cover"
                  />
                ) : (
                  <img
                    src={`${API_URL}/rh/media-posts/${post.id}/file`}
                    alt={post.caption ?? "Média"}
                    className="h-36 w-full rounded object-cover"
                  />
                )}
                <p className="mt-2 font-sans text-sm text-white/85">{post.caption ?? "—"}</p>
                {post.auteur && (
                  <p className="mt-1 font-mono text-xs text-white/40">Publié par {post.auteur}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-widest ${
                      post.publiee ? "text-success" : "text-white/40"
                    }`}
                  >
                    {post.publiee ? "Publié" : "Masqué"}
                  </span>
                  <Button variant="ghostDark" onClick={() => togglePublie(post)}>
                    {post.publiee ? "Masquer" : "Publier"}
                  </Button>
                  <Button variant="ghostDark" onClick={() => supprimer(post)}>
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}
