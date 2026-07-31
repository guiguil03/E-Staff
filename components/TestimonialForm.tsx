'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * Sibling of `components/CommentForm.tsx`, following the exact same shape
 * (local state, POST to a not-yet-existing API route, pending-moderation
 * message on success, graceful inline error on failure) — but for site-wide
 * testimonials on `/communaute` rather than per-article comments. Kept as a
 * separate component instead of reusing CommentForm because CommentForm is
 * hard-wired to an `articleSlug`, which doesn't apply here.
 */
export function TestimonialForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [body, setBody] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, body }),
      })
      if (!res.ok) {
        throw new Error("La publication de l'avis a échoué.")
      }
      setSubmitted(true)
      setFirstName('')
      setBody('')
      onSubmitted()
    } catch {
      setError('Une erreur est survenue. Merci de réessayer plus tard.')
    }
  }

  if (submitted) {
    return (
      <p className="text-sm text-muted">
        Merci ! Votre avis est en attente de modération avant publication.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        required
        placeholder="Votre prénom"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="rounded border border-muted/40 px-3 py-2"
      />
      <textarea
        required
        placeholder="Votre expérience e-Staf"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="rounded border border-muted/40 px-3 py-2"
      />
      {error && <p className="text-sm text-accent">{error}</p>}
      <Button type="submit">Publier mon avis</Button>
    </form>
  )
}
