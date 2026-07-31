'use client'
import { useState, type ReactNode } from 'react'
import { IconCamera, IconCommentBubble, IconHeart, IconUpload, IconVideo } from '@/components/Icons'

/**
 * "Le Mur des Performances & Médias" — a UI shell. There is no real media
 * library yet, so every post below is a clearly-flagged EXAMPLE: a colored
 * panel standing in for a photo/video (never a fabricated stock photo),
 * exactly like the hero placeholder was flagged as a stand-in during an
 * earlier phase of this project. Replace with real team/campaign media once
 * it exists. Likes/comments update local component state only — there is no
 * backend yet (see `lib/prisma.ts`, which doesn't exist).
 */

type Tone = 'primary' | 'accent' | 'success'

const TONE_BG: Record<Tone, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
}

type Post = {
  id: string
  kind: 'photo' | 'video'
  tone: Tone
  category: string
  caption: string
  firstname: string
}

const EXAMPLE_POSTS: Post[] = [
  {
    id: 'p1',
    kind: 'photo',
    tone: 'primary',
    category: 'Moment d’équipe',
    caption: 'Débrief hebdomadaire du pôle Support Digital, ambiance studieuse et solidaire.',
    firstname: 'Iavo',
  },
  {
    id: 'p2',
    kind: 'video',
    tone: 'accent',
    category: 'Temps fort de campagne',
    caption: 'La Squad Setters fête le dépassement de son objectif de qualification du mois.',
    firstname: 'Nathalie',
  },
  {
    id: 'p3',
    kind: 'photo',
    tone: 'success',
    category: 'Portrait — leader',
    caption: 'Portrait de Tovo, formateur FOL, avant une session d’éloquence avec les 15 Talents.',
    firstname: 'Tovo',
  },
  {
    id: 'p4',
    kind: 'photo',
    tone: 'accent',
    category: 'Portrait — professeur',
    caption: 'Une formatrice DELF/DALF prépare sa salle avant la session du matin.',
    firstname: 'Fara',
  },
  {
    id: 'p5',
    kind: 'video',
    tone: 'primary',
    category: 'Moment d’équipe',
    caption: 'Remise des attestations aux agents ayant validé leur montée de niveau ce trimestre.',
    firstname: 'Marc',
  },
] as const

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(12)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [localComments, setLocalComments] = useState<string[]>([])

  function toggleLike() {
    setLiked((v) => !v)
    setLikes((n) => (liked ? n - 1 : n + 1))
  }

  function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    // Local-only: no backend exists yet, this never leaves the browser.
    setLocalComments((c) => [...c, comment.trim()])
    setComment('')
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-muted/15 bg-white shadow-sm">
      <div className={`relative flex h-40 items-center justify-center ${TONE_BG[post.tone]}`}>
        <span
          aria-hidden="true"
          className="absolute left-3 top-3 rounded bg-white/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink"
        >
          Exemple
        </span>
        {post.kind === 'photo' ? (
          <IconCamera className="h-10 w-10 text-white/85" />
        ) : (
          <IconVideo className="h-10 w-10 text-white/85" />
        )}
        <span className="absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-wide text-white/70">
          {post.kind === 'photo' ? 'Photo' : 'Vidéo'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-accent">
          {post.category}
        </p>
        <p className="mb-2 text-sm text-ink">{post.caption}</p>
        <p className="mb-4 text-xs text-muted">— {post.firstname}</p>
        <div className="mt-auto flex items-center gap-4 border-t border-muted/20 pt-3">
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            className={`flex items-center gap-1.5 text-xs motion-safe:transition-colors motion-safe:duration-150 ${
              liked ? 'text-accent' : 'text-muted hover:text-ink'
            }`}
          >
            <IconHeart filled={liked} className="h-4 w-4" />
            {likes}
          </button>
          <button
            type="button"
            onClick={() => setShowComment((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-ink motion-safe:transition-colors motion-safe:duration-150"
          >
            <IconCommentBubble className="h-4 w-4" />
            {localComments.length}
          </button>
        </div>
        {showComment && (
          <div className="mt-3 border-t border-muted/20 pt-3">
            {localComments.length > 0 && (
              <ul className="mb-2 flex flex-col gap-1.5">
                {localComments.map((c, i) => (
                  <li key={i} className="text-xs text-muted">
                    {c}
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={submitComment} className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Votre commentaire"
                className="flex-1 rounded border border-muted/40 px-2 py-1 text-xs"
              />
              <button
                type="submit"
                className="rounded border border-primary px-2 py-1 font-mono text-[10px] uppercase text-primary hover:bg-primary hover:text-white motion-safe:transition motion-safe:duration-150"
              >
                Envoyer
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function UploadPanel() {
  const [fileName, setFileName] = useState<string | null>(null)
  return (
    <div className="rounded-2xl border border-dashed border-accent/50 bg-accent/5 p-5">
      <p className="mb-1 font-medium text-ink">Importer une photo ou une vidéo</p>
      <p className="mb-3 text-xs text-muted">
        Partagez vos propres souvenirs e-Staf. Chaque envoi sera examiné avant publication —
        rien n&apos;apparaît sur le mur avant validation par notre équipe.
      </p>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IconUpload className="h-5 w-5" />
        </span>
        <span className="underline">{fileName ?? 'Choisir un fichier'}</span>
        <input
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      {fileName && (
        <p className="mt-2 font-mono text-xs text-success">
          « {fileName} » prêt — sera examiné avant publication.
        </p>
      )}
    </div>
  )
}

export function PerformanceWall(): ReactNode {
  return (
    <div>
      <p className="mb-6 max-w-2xl rounded-lg bg-primary/5 px-4 py-3 text-xs text-muted">
        Chaque contenu partagé par la communauté — photo, vidéo ou commentaire — passe par une
        prévisualisation et une validation avant d&apos;être publié sur le mur.
      </p>
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMPLE_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <UploadPanel />
    </div>
  )
}
