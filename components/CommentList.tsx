'use client'
import { useEffect, useState } from 'react'
import type { CommentDTO } from '@/lib/types'

export function CommentList({ articleSlug, refreshKey }: { articleSlug: string; refreshKey: number }) {
  const [comments, setComments] = useState<CommentDTO[]>([])

  useEffect(() => {
    fetch(`/api/comments?articleSlug=${articleSlug}`)
      .then((res) => res.json())
      .then(setComments)
      .catch(() => setComments([]))
  }, [articleSlug, refreshKey])

  if (comments.length === 0) {
    return <p className="text-sm text-muted">Aucun commentaire pour l&apos;instant.</p>
  }

  return (
    <ul className="flex flex-col gap-4">
      {comments.map((c) => (
        <li key={c.id} className="border-b border-muted/30 pb-3">
          <p className="font-medium">{c.author.firstname}</p>
          <p className="text-sm">{c.body}</p>
        </li>
      ))}
    </ul>
  )
}
