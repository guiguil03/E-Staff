'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * Shared coordinates-collection step used before every candidate test
 * (DELF/DALF, TEF Canada/TCF, DFP, FOL, and each Studio Métier job track).
 * Same shape and behavior as `components/ContactForm.tsx`: local state only,
 * POSTs to an API route that doesn't exist yet (no database is connected —
 * see `lib/prisma.ts`, which doesn't exist), and fails gracefully with an
 * inline message instead of crashing.
 *
 * `segment` identifies which funnel submitted the coordinates (e.g.
 * "delf-dalf", "tef-canada", "dfp", "fol", or a métier slug like
 * "teleconseiller") — this is what the cahier calls storing coordinates
 * "segmentée selon le type d'examen".
 */
export function RegistrationForm({
  segment,
  ctaLabel = 'Passer le test',
  className = '',
}: {
  segment: string
  ctaLabel?: string
  className?: string
}) {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // `segment` is included so coordinates are already shaped for
        // per-funnel storage once a backend/database exists (task deferred —
        // see cahier des charges §7.3, application work, not site vitrine).
        body: JSON.stringify({ firstName, email, phone, segment }),
      })
      if (!res.ok) {
        throw new Error("L'enregistrement des coordonnées a échoué.")
      }
      setSubmitted(true)
      setFirstName('')
      setEmail('')
      setPhone('')
    } catch {
      setError(
        "Une erreur est survenue. Vos coordonnées n'ont pas pu être enregistrées automatiquement — contactez-nous directement en attendant."
      )
    } finally {
      setPending(false)
    }
  }

  if (submitted) {
    return (
      <div className={`rounded-2xl border border-success/30 bg-success/5 p-6 ${className}`}>
        <p className="mb-2 font-mono text-xs uppercase tracking-wide text-success">
          Coordonnées enregistrées
        </p>
        <p className="text-sm leading-relaxed text-ink">
          Merci, vos coordonnées sont enregistrées. Le test va commencer — le résultat ne
          vous sera pas communiqué immédiatement, vous serez recontacté personnellement une
          fois votre évaluation faite.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${className}`}>
      <input
        type="text"
        required
        placeholder="Votre prénom"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="rounded border border-muted/40 px-3 py-2"
      />
      <input
        type="email"
        required
        placeholder="Votre email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded border border-muted/40 px-3 py-2"
      />
      <input
        type="tel"
        required
        placeholder="Votre téléphone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded border border-muted/40 px-3 py-2"
      />
      {error && <p className="text-sm text-accent">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Envoi...' : ctaLabel}
      </Button>
      <p className="text-xs text-muted">
        Le résultat de ce test ne vous sera pas communiqué immédiatement : vous serez
        recontacté par notre équipe une fois votre évaluation faite.
      </p>
    </form>
  )
}
