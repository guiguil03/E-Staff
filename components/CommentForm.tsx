'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function CommentForm({
  articleSlug,
  onSubmitted,
}: {
  articleSlug: string
  onSubmitted: () => void
}) {
  // TODO(task-11): replace useState with useDraftSave for localStorage draft persistence
  const [firstName, setFirstName] = useState('')
  const [body, setBody] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleSlug, firstName, body }),
      })
      if (!res.ok) {
        throw new Error('La publication du commentaire a échoué.')
      }
      setSubmitted(true)
      setFirstName('')
      setBody('')
      onSubmitted()
    } catch {
      setError("Une erreur est survenue. Merci de réessayer plus tard.")
    }
  }

  if (submitted) {
    return (
      <p className="text-sm text-muted">
        Merci ! Votre commentaire est en attente de modération.
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
        className="border border-muted/40 rounded px-3 py-2"
      />
      <textarea
        required
        placeholder="Votre commentaire"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="border border-muted/40 rounded px-3 py-2"
      />
      {error && <p className="text-sm text-accent">{error}</p>}
      <Button type="submit">Publier mon commentaire</Button>
    </form>
  )
}
