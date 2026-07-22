import Link from 'next/link'
import { getAllArticles } from '@/lib/content'
import { Card } from '@/components/ui/Card'

export default function PublicationsPage() {
  const articles = getAllArticles()

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl mb-8">Publications</h1>
      <div className="flex flex-col gap-6">
        {articles.map((article) => (
          <Link key={article.slug} href={`/publications/${article.slug}`}>
            <Card>
              <p className="font-mono text-xs text-muted mb-2">
                {article.category} — {new Date(article.publishedAt).toLocaleDateString('fr-FR')}
              </p>
              <h2 className="text-xl mb-2">{article.title}</h2>
              <p className="text-sm text-muted">{article.excerpt}</p>
              <p className="text-sm mt-2">Par {article.author.firstname}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}
