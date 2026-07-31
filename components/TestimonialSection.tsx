'use client'
import { useState } from 'react'
import { TestimonialForm } from '@/components/TestimonialForm'
import { TestimonialList } from '@/components/TestimonialList'

/** Sibling of `components/CommentSection.tsx`, wiring `TestimonialForm` +
 * `TestimonialList` together the same way — kept compact per the Communauté
 * page's brief (not a heavy comment thread, one-way, no visitor-to-visitor
 * replies). */
export function TestimonialSection() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div>
      <TestimonialList refreshKey={refreshKey} />
      <div className="mt-6 border-t border-muted/30 pt-6">
        <TestimonialForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
      </div>
    </div>
  )
}
