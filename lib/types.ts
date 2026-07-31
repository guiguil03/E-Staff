export interface PublicPerson {
  firstname: string
}

export interface Article {
  title: string
  slug: string
  excerpt: string
  author: PublicPerson
  publishedAt: string
  category: 'réussite' | 'conseils langue' | 'actus académie'
  coverImage: string
  content: string
}

export interface CommentDTO {
  id: string
  articleSlug: string
  author: PublicPerson
  body: string
  createdAt: string
}

/** Site-wide testimonial (Communauté page) — same moderated, one-way shape
 * as CommentDTO (submit → pending → shown only once approved), but not tied
 * to an article slug. */
export interface TestimonialDTO {
  id: string
  author: PublicPerson
  body: string
  createdAt: string
}

export interface ContactMessageDTO {
  id: string
  firstName: string
  email: string
  subject: string
  body: string
  read: boolean
  createdAt: string
}
