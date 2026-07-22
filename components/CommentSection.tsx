'use client'
import { useState } from 'react'
import { CommentForm } from '@/components/CommentForm'
import { CommentList } from '@/components/CommentList'

export function CommentSection({ articleSlug }: { articleSlug: string }) {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <section>
      <h2 className="text-xl mb-4">Commentaires</h2>
      <CommentList articleSlug={articleSlug} refreshKey={refreshKey} />
      <div className="mt-6">
        <CommentForm articleSlug={articleSlug} onSubmitted={() => setRefreshKey((k) => k + 1)} />
      </div>
    </section>
  )
}
