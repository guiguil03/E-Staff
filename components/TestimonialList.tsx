'use client'
import { useEffect, useState } from 'react'
import type { TestimonialDTO } from '@/lib/types'

/** Sibling of `components/CommentList.tsx` for site-wide testimonials — same
 * fetch-then-fall-back-to-empty pattern, since `/api/testimonials` doesn't
 * exist yet (no database connected). Only approved testimonials would ever
 * appear here once a backend exists; today the list is always empty, which
 * is exactly the "not shown until approved" behavior this page needs to
 * demonstrate. */
export function TestimonialList({ refreshKey }: { refreshKey: number }) {
  const [testimonials, setTestimonials] = useState<TestimonialDTO[]>([])

  useEffect(() => {
    fetch('/api/testimonials')
      .then((res) => res.json())
      .then(setTestimonials)
      .catch(() => setTestimonials([]))
  }, [refreshKey])

  if (testimonials.length === 0) {
    return (
      <p className="text-sm text-muted">
        Aucun avis publié pour l&apos;instant — les avis approuvés apparaîtront ici.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {testimonials.map((t) => (
        <li key={t.id} className="border-b border-muted/30 pb-3">
          <p className="font-medium">{t.author.firstname}</p>
          <p className="text-sm">{t.body}</p>
        </li>
      ))}
    </ul>
  )
}
