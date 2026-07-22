import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getArticleBySlug, getAllArticles } from '@/lib/content'
import { CommentSection } from '@/components/CommentSection'

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }))
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug)
  if (!article) notFound()

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-mono text-xs text-muted mb-2">
        {article.category} — {new Date(article.publishedAt).toLocaleDateString('fr-FR')}
      </p>
      <h1 className="text-3xl mb-2">{article.title}</h1>
      <p className="text-sm mb-8">Par {article.author.firstname}</p>
      <article className="prose prose-neutral max-w-none mb-12">
        <MDXRemote source={article.content} />
      </article>
      <CommentSection articleSlug={article.slug} />
    </main>
  )
}
