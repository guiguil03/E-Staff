import type { PublicPerson } from '@/lib/types'

export function QuoteBlock({
  quote,
  person,
  result,
}: {
  quote: string
  person: PublicPerson
  result: string
}) {
  return (
    <blockquote className="border-l-4 border-accent pl-4">
      <p className="text-lg font-display mb-2">&laquo;&nbsp;{quote}&nbsp;&raquo;</p>
      <footer className="text-sm text-muted">
        <span className="font-medium text-ink">{person.firstname}</span> — {result}
      </footer>
    </blockquote>
  )
}
