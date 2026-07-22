import { describe, it, expect } from 'vitest'
import { getAllArticles, getArticleBySlug } from '@/lib/content'

describe('content loader', () => {
  it('lists all articles sorted by publishedAt descending', () => {
    const articles = getAllArticles()
    expect(articles.length).toBeGreaterThan(0)
    expect(articles[0].author.firstname).toBe('Fara')
    expect(articles[0]).not.toHaveProperty('lastname')
  })

  it('loads a single article by slug', () => {
    const article = getArticleBySlug('decroche-poste-apres-17-jours')
    expect(article?.title).toBe("Décroché un poste après 17 jours de formation")
    expect(article?.category).toBe('réussite')
  })

  it('returns null for an unknown slug', () => {
    expect(getArticleBySlug('ne-existe-pas')).toBeNull()
  })
})
