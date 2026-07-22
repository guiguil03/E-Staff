import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { Article } from '@/lib/types'

const ARTICLES_DIR = path.join(process.cwd(), 'content/articles')

function fileToArticle(filename: string): Article {
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, filename), 'utf8')
  const { data, content } = matter(raw)
  return {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    author: { firstname: data.author_firstname },
    publishedAt: data.published_at,
    category: data.category,
    coverImage: data.cover_image,
    content,
  }
}

export function getAllArticles(): Article[] {
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.mdx'))
  return files
    .map(fileToArticle)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
}

export function getArticleBySlug(slug: string): Article | null {
  return getAllArticles().find((a) => a.slug === slug) ?? null
}
