'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function ContactForm({ defaultSubject = '' }: { defaultSubject?: string }) {
  // TODO(task-11): replace useState with useDraftSave for localStorage draft persistence
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email, subject, body }),
      })
      if (!res.ok) {
        throw new Error("L'envoi du message a échoué.")
      }
      setSubmitted(true)
      setFirstName('')
      setEmail('')
      setSubject('')
      setBody('')
    } catch {
      setError('Une erreur est survenue. Merci de réessayer plus tard.')
    } finally {
      setPending(false)
    }
  }

  if (submitted) {
    return (
      <p className="text-sm text-muted">
        Message envoyé. On te répond directement.
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
      <input
        type="email"
        required
        placeholder="Votre email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-muted/40 rounded px-3 py-2"
      />
      <input
        type="text"
        required
        placeholder="Sujet"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="border border-muted/40 rounded px-3 py-2"
      />
      <textarea
        required
        placeholder="Votre message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        className="border border-muted/40 rounded px-3 py-2"
      />
      {error && <p className="text-sm text-accent">{error}</p>}
      <Button type="submit">{pending ? 'Envoi...' : 'Envoyer le message'}</Button>
    </form>
  )
}
