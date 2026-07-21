# Site vitrine (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public Phase 1 vitrine site (Next.js) for the Madagascar language academy / B2B call-center staffing business: home, publications with moderated comments, 3 offer pages, careers CTA, about, contact, legal pages, and a minimal password-protected admin to moderate comments and read contact messages.

**Architecture:** Next.js 14 App Router + TypeScript + Tailwind (fully custom theme, no default Tailwind colors). Articles are MDX files in the repo. Comments and contact messages persist in Postgres (Neon) via Prisma. Admin auth is a single shared password, JWT session cookie signed with `jose`, checked in Next.js middleware. No CMS, no multi-user roles, no transactional email in this phase.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma + Postgres (Neon), gray-matter + next-mdx-remote, jose (JWT), bcryptjs, Vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-07-21-site-vitrine-design.md`

---

## File Structure Overview

```
app/
  layout.tsx                       root layout, fonts, Header/Footer
  page.tsx                         home
  publications/page.tsx            article list
  publications/[slug]/page.tsx     article + comments
  offres/examens/page.tsx
  offres/fol/page.tsx
  offres/carrieres/page.tsx
  a-propos/page.tsx
  contact/page.tsx
  mentions-legales/page.tsx
  confidentialite/page.tsx
  admin/login/page.tsx
  admin/page.tsx                   moderation dashboard
  api/comments/route.ts            GET (approved) / POST (pending)
  api/contact/route.ts             POST
  api/admin/login/route.ts         POST
  api/admin/comments/[id]/route.ts PATCH approve/reject
  middleware.ts                    protects /admin, /api/admin/*
components/
  ui/Button.tsx
  ui/Badge.tsx
  ui/Card.tsx
  ui/QuoteBlock.tsx
  LanguageRibbon.tsx
  Header.tsx
  Footer.tsx
  CommentForm.tsx
  CommentList.tsx
  ContactForm.tsx
lib/
  content.ts                       MDX article loader
  types.ts                         PublicPerson, Article, Comment types
  prisma.ts                        Prisma client singleton
  auth.ts                          sign/verify session JWT, password check
  useDraftSave.ts                  localStorage draft-save hook
content/
  articles/*.mdx                   seed articles
prisma/
  schema.prisma
tests/
  lib/content.test.ts
  lib/useDraftSave.test.ts
  api/comments.test.ts
  api/contact.test.ts
  lib/auth.test.ts
```

---

### Task 1: Project scaffolding + Tailwind theme

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `postcss.config.js`, `tailwind.config.ts`, `app/globals.css`
- Create: `.gitignore`, `.env.example`

- [ ] **Step 1: Scaffold Next.js app**

Run:
```bash
npx create-next-app@14 . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint
```
When prompted, keep defaults. This creates `package.json`, `tsconfig.json`, `next.config.js`, `app/`, `tailwind.config.ts`, `app/globals.css`.

- [ ] **Step 2: Replace Tailwind theme with custom tokens (no default Tailwind colors)**

Edit `tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      background: '#F3F5F1',
      ink: '#1A1D1B',
      primary: '#1B3A4B',
      accent: '#D99A2B',
      success: '#2F6B4F',
      muted: '#8C8579',
      white: '#FFFFFF',
    },
    fontFamily: {
      display: ['var(--font-fraunces)', 'serif'],
      sans: ['var(--font-plex-sans)', 'sans-serif'],
      mono: ['var(--font-plex-mono)', 'monospace'],
    },
    borderRadius: {
      none: '0px',
      DEFAULT: '7px',
      full: '9999px',
    },
    extend: {},
  },
  plugins: [],
}
export default config
```

Replacing `theme.colors` entirely (not using `extend`) is deliberate: it removes every default Tailwind color (`red-500`, `slate-100`, etc.) from autocomplete and from the codebase, so nobody can accidentally reach for a default color.

- [ ] **Step 3: Set base styles**

Edit `app/globals.css` (replace generated content):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-background text-ink font-sans;
  }
  h1, h2, h3 {
    @apply font-display;
  }
}
```

- [ ] **Step 4: Add env template**

Create `.env.example`:
```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
ADMIN_PASSWORD_HASH=""
SESSION_SECRET=""
```

- [ ] **Step 5: Verify dev server boots**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000`, default Next.js page renders with the new background color visible (`#F3F5F1`, not white).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js app with custom Tailwind theme"
```

---

### Task 2: Self-hosted fonts (Fraunces, IBM Plex Sans, IBM Plex Mono)

**Files:**
- Create: `lib/fonts.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Declare fonts via next/font**

Create `lib/fonts.ts`:
```ts
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'

export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
})

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})
```
`next/font/google` downloads and self-hosts the font files at build time — no runtime request to Google Fonts, which matters on the low-bandwidth connections mentioned in the spec.

- [ ] **Step 2: Wire font variables into the root layout**

Edit `app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { fraunces, plexSans, plexMono } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Académie & Production — Madagascar',
  description: "Formation en langues et mise à disposition d'agents formés, à Madagascar.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Verify fonts load**

Run: `npm run dev`, open `http://localhost:3000`, inspect a heading in devtools.
Expected: computed `font-family` for `<h1>`/`<h2>` resolves to Fraunces; body text resolves to IBM Plex Sans.

- [ ] **Step 4: Commit**

```bash
git add lib/fonts.ts app/layout.tsx
git commit -m "Add self-hosted Fraunces/IBM Plex fonts"
```

---

### Task 3: Shared types (public-person confidentiality constraint)

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Define the types**

Create `lib/types.ts`:
```ts
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

export interface ContactMessageDTO {
  id: string
  firstName: string
  email: string
  subject: string
  body: string
  read: boolean
  createdAt: string
}
```
`PublicPerson` intentionally has only `firstname`. Any component rendering a person publicly (hero, article byline, comment) takes a `PublicPerson`, so there is no `lastname` field available to render by mistake anywhere in the public UI.

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "Add shared types with firstname-only PublicPerson constraint"
```

---

### Task 4: MDX article content loader (TDD)

**Files:**
- Create: `content/articles/exemple-decroche-poste.mdx`
- Create: `lib/content.ts`
- Test: `tests/lib/content.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install test tooling**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
npm install gray-matter next-mdx-remote
```

- [ ] **Step 2: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 3: Add one seed article fixture**

Create `content/articles/exemple-decroche-poste.mdx`:
```mdx
---
title: "Décroché un poste après 17 jours de formation"
slug: "decroche-poste-apres-17-jours"
excerpt: "Fara a rejoint l'académie en niveau A2. Trois semaines plus tard, elle passait ses premiers entretiens en anglais."
author_firstname: "Fara"
published_at: "2026-05-12"
category: "réussite"
cover_image: "/images/articles/decroche-poste.jpg"
---

Fara est arrivée en A2. Dix-sept jours de formation intensive plus tard, elle a passé
trois entretiens en anglais la même semaine et signé pour un poste de support client
sur un projet international.

"Je ne pensais pas tenir une conversation de 20 minutes sans bloquer. Ici, on ne fait
que ça toute la journée," dit-elle.
```

- [ ] **Step 4: Write the failing test for the content loader**

Create `tests/lib/content.test.ts`:
```ts
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
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test -- content.test.ts`
Expected: FAIL — `Cannot find module '@/lib/content'`

- [ ] **Step 6: Implement the content loader**

Create `lib/content.ts`:
```ts
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
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- content.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 8: Commit**

```bash
git add content/articles/exemple-decroche-poste.mdx lib/content.ts tests/lib/content.test.ts vitest.config.ts package.json
git commit -m "Add MDX article loader with tests"
```

---

### Task 5: Prisma schema + Neon connection

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Modify: `.env.example`, `.gitignore`

- [ ] **Step 1: Install Prisma**

Run: `npm install prisma @prisma/client && npx prisma init --datasource-provider postgresql`

This creates `prisma/schema.prisma` and adds `DATABASE_URL` to `.env` (already templated in `.env.example` from Task 1).

- [ ] **Step 2: Define the schema**

Edit `prisma/schema.prisma` datasource + add models:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Comment {
  id          String   @id @default(cuid())
  articleSlug String
  firstName   String
  body        String
  status      String   @default("pending") // pending | approved | rejected
  createdAt   DateTime @default(now())

  @@index([articleSlug, status])
}

model ContactMessage {
  id        String   @id @default(cuid())
  firstName String
  email     String
  subject   String
  body      String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

- [ ] **Step 3: Create the Prisma client singleton**

Create `lib/prisma.ts`:
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```
The global cache prevents Next.js dev-mode hot-reload from opening a new Postgres connection pool on every file save.

- [ ] **Step 4: Point `DATABASE_URL` at a real Neon database and run the migration**

Create a free Neon project at https://neon.tech (user action — needs a Neon account), copy the connection string into `.env` (not `.env.example`), then:

Run: `npx prisma migrate dev --name init`
Expected: migration applies, `Comment` and `ContactMessage` tables exist in the Neon database.

- [ ] **Step 5: Confirm `.gitignore` excludes secrets**

Edit `.gitignore`, ensure it contains:
```
.env
.env.local
```
(`create-next-app` already adds these; verify, don't duplicate.)

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma lib/prisma.ts .env.example
git commit -m "Add Prisma schema for comments and contact messages"
```

---

### Task 6: Comments API (TDD)

**Files:**
- Create: `app/api/comments/route.ts`
- Test: `tests/api/comments.test.ts`

- [ ] **Step 1: Write failing tests for the route handlers**

Create `tests/api/comments.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/comments/route'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    comment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('GET /api/comments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns only approved comments for the given article, flattened to firstname', async () => {
    ;(prisma.comment.findMany as any).mockResolvedValue([
      { id: '1', articleSlug: 'a', firstName: 'Fara', body: 'Bravo !', createdAt: new Date('2026-01-01') },
    ])

    const req = new Request('http://localhost/api/comments?articleSlug=a')
    const res = await GET(req)
    const json = await res.json()

    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { articleSlug: 'a', status: 'approved' } })
    )
    expect(json[0].author).toEqual({ firstname: 'Fara' })
    expect(json[0]).not.toHaveProperty('firstName')
  })
})

describe('POST /api/comments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a pending comment and does not echo it back as approved', async () => {
    ;(prisma.comment.create as any).mockResolvedValue({
      id: '2', articleSlug: 'a', firstName: 'Fara', body: 'Merci', status: 'pending', createdAt: new Date(),
    })

    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      body: JSON.stringify({ articleSlug: 'a', firstName: 'Fara', body: 'Merci' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    expect(prisma.comment.create).toHaveBeenCalledWith({
      data: { articleSlug: 'a', firstName: 'Fara', body: 'Merci', status: 'pending' },
    })
  })

  it('rejects an empty body with 400', async () => {
    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      body: JSON.stringify({ articleSlug: 'a', firstName: '', body: '' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- comments.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/comments/route'`

- [ ] **Step 3: Implement the route**

Create `app/api/comments/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { CommentDTO } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const articleSlug = searchParams.get('articleSlug')
  if (!articleSlug) {
    return NextResponse.json({ error: 'articleSlug is required' }, { status: 400 })
  }

  const comments = await prisma.comment.findMany({
    where: { articleSlug, status: 'approved' },
    orderBy: { createdAt: 'desc' },
  })

  const dtos: CommentDTO[] = comments.map((c) => ({
    id: c.id,
    articleSlug: c.articleSlug,
    author: { firstname: c.firstName },
    body: c.body,
    createdAt: c.createdAt.toISOString(),
  }))

  return NextResponse.json(dtos)
}

export async function POST(request: Request) {
  const payload = await request.json()
  const { articleSlug, firstName, body } = payload

  if (!articleSlug || !firstName?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'articleSlug, firstName and body are required' }, { status: 400 })
  }

  await prisma.comment.create({
    data: { articleSlug, firstName: firstName.trim(), body: body.trim(), status: 'pending' },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
```
The GET handler maps `firstName` (DB column) to `author: { firstname }` (`PublicPerson`) explicitly, so the raw Prisma row — which is fine to keep a real name in later, if ever needed — never reaches the response as-is.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- comments.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/comments/route.ts tests/api/comments.test.ts
git commit -m "Add comments API with pending/approved flow"
```

---

### Task 7: Contact API (TDD)

**Files:**
- Create: `app/api/contact/route.ts`
- Test: `tests/api/contact.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/api/contact.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/contact/route'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: { contactMessage: { create: vi.fn() } },
}))

describe('POST /api/contact', () => {
  beforeEach(() => vi.clearAllMocks())

  it('stores a valid contact message', async () => {
    ;(prisma.contactMessage.create as any).mockResolvedValue({ id: '1' })
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Iavo', email: 'iavo@example.com', subject: 'Question', body: 'Bonjour' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(prisma.contactMessage.create).toHaveBeenCalledWith({
      data: { firstName: 'Iavo', email: 'iavo@example.com', subject: 'Question', body: 'Bonjour' },
    })
  })

  it('rejects an invalid email with 400', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Iavo', email: 'not-an-email', subject: 'Q', body: 'B' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- contact.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement route**

Create `app/api/contact/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const { firstName, email, subject, body } = await request.json()

  if (!firstName?.trim() || !EMAIL_RE.test(email ?? '') || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Champs invalides' }, { status: 400 })
  }

  await prisma.contactMessage.create({
    data: { firstName: firstName.trim(), email, subject: subject.trim(), body: body.trim() },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- contact.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/contact/route.ts tests/api/contact.test.ts
git commit -m "Add contact form API"
```

---

### Task 8: Admin auth — password check + session JWT (TDD)

**Files:**
- Create: `lib/auth.ts`
- Test: `tests/lib/auth.test.ts`

- [ ] **Step 1: Install auth deps**

Run: `npm install bcryptjs jose`
Run: `npm install -D @types/bcryptjs`

- [ ] **Step 2: Write failing tests**

Create `tests/lib/auth.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import { verifyPassword, createSessionToken, verifySessionToken } from '@/lib/auth'

describe('verifyPassword', () => {
  it('accepts the correct password against its hash', async () => {
    const hash = await bcrypt.hash('correct horse', 10)
    expect(await verifyPassword('correct horse', hash)).toBe(true)
  })

  it('rejects a wrong password', async () => {
    const hash = await bcrypt.hash('correct horse', 10)
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })
})

describe('session token', () => {
  it('accepts a valid token', async () => {
    const token = await createSessionToken('secret-key-at-least-32-chars-long')
    const valid = await verifySessionToken(token, 'secret-key-at-least-32-chars-long')
    expect(valid).toBe(true)
  })

  it('rejects a token signed with a different secret', async () => {
    const token = await createSessionToken('secret-key-at-least-32-chars-long')
    const valid = await verifySessionToken(token, 'a-completely-different-secret-32')
    expect(valid).toBe(false)
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- auth.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `lib/auth.ts`**

```ts
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function createSessionToken(secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret)
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(key)
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  try {
    const key = new TextEncoder().encode(secret)
    await jwtVerify(token, key)
    return true
  } catch {
    return false
  }
}
```
`verifySessionToken` returns a plain `boolean` (not the decoded payload) — Task 9's middleware only needs to know valid/invalid, so this keeps the interface minimal.

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- auth.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts tests/lib/auth.test.ts package.json
git commit -m "Add admin password + session token verification"
```

---

### Task 9: Admin login route + middleware protection

**Files:**
- Create: `app/api/admin/login/route.ts`
- Create: `middleware.ts`
- Create: `app/admin/login/page.tsx`

- [ ] **Step 1: Generate the admin password hash (manual, one-time)**

Run:
```bash
node -e "require('bcryptjs').hash(process.argv[1], 10).then(console.log)" "choose-a-strong-password"
```
Copy the printed hash into `.env` as `ADMIN_PASSWORD_HASH`. Generate a random 32+ character string for `SESSION_SECRET` (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) and add it to `.env` too.

- [ ] **Step 2: Implement the login route**

Create `app/api/admin/login/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { verifyPassword, createSessionToken } from '@/lib/auth'

export async function POST(request: Request) {
  const { password } = await request.json()
  const hash = process.env.ADMIN_PASSWORD_HASH
  const secret = process.env.SESSION_SECRET

  if (!hash || !secret || !password || !(await verifyPassword(password, hash))) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const token = await createSessionToken(secret)
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
  return res
}
```

- [ ] **Step 3: Implement middleware protecting `/admin` and `/api/admin/*`**

Create `middleware.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth'

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next()

  const token = request.cookies.get('admin_session')?.value
  const secret = process.env.SESSION_SECRET
  const valid = token && secret ? await verifySessionToken(token, secret) : false

  if (!valid) {
    if (request.nextUrl.pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}
```

- [ ] **Step 4: Build the login page**

Create `app/admin/login/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Mot de passe incorrect.')
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl mb-6">Connexion admin</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="border border-muted rounded px-3 py-2"
        />
        {error && <p className="text-accent text-sm">{error}</p>}
        <button type="submit" className="bg-primary text-white rounded px-4 py-2">
          Se connecter
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, visit `http://localhost:3000/admin` → expect redirect to `/admin/login`. Log in with the password chosen in Step 1 → expect redirect to `/admin` (page doesn't exist yet, 404 is fine at this point — confirms the cookie/middleware path works since it no longer redirects to login).

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/login/route.ts middleware.ts app/admin/login/page.tsx
git commit -m "Add admin login route and middleware protection"
```

---

### Task 10: Admin dashboard — moderate comments + read contact messages

**Files:**
- Create: `app/api/admin/comments/[id]/route.ts`
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Implement the moderation PATCH route**

Create `app/api/admin/comments/[id]/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { status } = await request.json()
  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 })
  }
  await prisma.comment.update({ where: { id: params.id }, data: { status } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Build the dashboard page (server component, direct Prisma read — already behind middleware)**

Create `app/admin/page.tsx`:
```tsx
import { prisma } from '@/lib/prisma'
import { AdminCommentRow } from '@/components/AdminCommentRow'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const pendingComments = await prisma.comment.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
  })
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl mb-8">Modération</h1>

      <section className="mb-12">
        <h2 className="text-xl mb-4">Commentaires en attente ({pendingComments.length})</h2>
        <ul className="flex flex-col gap-4">
          {pendingComments.map((c) => (
            <AdminCommentRow key={c.id} id={c.id} firstName={c.firstName} body={c.body} />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl mb-4">Messages de contact ({messages.length})</h2>
        <ul className="flex flex-col gap-4">
          {messages.map((m) => (
            <li key={m.id} className="border border-muted rounded p-4">
              <p className="font-mono text-sm text-muted">{m.email} — {new Date(m.createdAt).toLocaleDateString('fr-FR')}</p>
              <p className="font-medium">{m.subject}</p>
              <p>{m.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Build the client-side approve/reject row component**

Create `components/AdminCommentRow.tsx`:
```tsx
'use client'
import { useState } from 'react'

export function AdminCommentRow({ id, firstName, body }: { id: string; firstName: string; body: string }) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')

  async function updateStatus(next: 'approved' | 'rejected') {
    await fetch(`/api/admin/comments/${id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) })
    setStatus(next)
  }

  if (status !== 'pending') {
    return <li className="border border-muted rounded p-4 opacity-50">{firstName}: {body} — {status}</li>
  }

  return (
    <li className="border border-muted rounded p-4">
      <p className="font-medium">{firstName}</p>
      <p className="mb-3">{body}</p>
      <div className="flex gap-2">
        <button onClick={() => updateStatus('approved')} className="bg-success text-white rounded px-3 py-1 text-sm">
          Approuver
        </button>
        <button onClick={() => updateStatus('rejected')} className="bg-ink text-white rounded px-3 py-1 text-sm">
          Rejeter
        </button>
      </div>
    </li>
  )
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, log into `/admin/login`, submit a test comment via `POST /api/comments` (curl or the future comment form), confirm it shows under "en attente", click Approuver, confirm `GET /api/comments?articleSlug=...` now returns it.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/comments app/admin/page.tsx components/AdminCommentRow.tsx
git commit -m "Add admin moderation dashboard"
```

---

### Task 11: localStorage draft-save hook (TDD)

**Files:**
- Create: `lib/useDraftSave.ts`
- Test: `tests/lib/useDraftSave.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/useDraftSave.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDraftSave } from '@/lib/useDraftSave'

describe('useDraftSave', () => {
  beforeEach(() => localStorage.clear())

  it('restores a previously saved draft on mount', () => {
    localStorage.setItem('draft:contact', JSON.stringify({ subject: 'Bonjour' }))
    const { result } = renderHook(() => useDraftSave('contact', { subject: '' }))
    expect(result.current.draft).toEqual({ subject: 'Bonjour' })
  })

  it('persists updates to localStorage', () => {
    const { result } = renderHook(() => useDraftSave('contact', { subject: '' }))
    act(() => result.current.setDraft({ subject: 'Nouveau sujet' }))
    expect(JSON.parse(localStorage.getItem('draft:contact')!)).toEqual({ subject: 'Nouveau sujet' })
  })

  it('clears the draft', () => {
    const { result } = renderHook(() => useDraftSave('contact', { subject: '' }))
    act(() => result.current.setDraft({ subject: 'x' }))
    act(() => result.current.clearDraft())
    expect(localStorage.getItem('draft:contact')).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- useDraftSave.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `lib/useDraftSave.ts`:
```ts
'use client'
import { useEffect, useState } from 'react'

export function useDraftSave<T>(key: string, initial: T) {
  const storageKey = `draft:${key}`
  const [draft, setDraftState] = useState<T>(initial)

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) setDraftState(JSON.parse(saved))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setDraft(value: T) {
    setDraftState(value)
    localStorage.setItem(storageKey, JSON.stringify(value))
  }

  function clearDraft() {
    setDraftState(initial)
    localStorage.removeItem(storageKey)
  }

  return { draft, setDraft, clearDraft }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- useDraftSave.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/useDraftSave.ts tests/lib/useDraftSave.test.ts
git commit -m "Add localStorage draft-save hook for weak-connection resilience"
```

---

### Task 12: LanguageRibbon signature component

**Files:**
- Create: `components/LanguageRibbon.tsx`

- [ ] **Step 1: Implement the component**

Create `components/LanguageRibbon.tsx`:
```tsx
'use client'
import { useEffect, useRef } from 'react'

const LEVELS = ['A1', 'B1', 'B2', 'C1'] as const
type Level = (typeof LEVELS)[number]

export function LanguageRibbon({
  variant = 'static',
  reachedLevel,
}: {
  variant?: 'animated' | 'static'
  reachedLevel?: Level
}) {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (variant !== 'animated' || !pathRef.current) return
    const length = pathRef.current.getTotalLength()
    pathRef.current.style.strokeDasharray = `${length}`
    pathRef.current.style.strokeDashoffset = `${length}`
    pathRef.current.getBoundingClientRect() // force reflow before transition
    pathRef.current.style.transition = 'stroke-dashoffset 1.2s ease-out'
    pathRef.current.style.strokeDashoffset = '0'
  }, [variant])

  return (
    <svg viewBox="0 0 400 40" className="w-full max-w-md" aria-hidden="true">
      <path
        ref={pathRef}
        d="M10 20 H390"
        stroke="#1B3A4B"
        strokeWidth="2"
        fill="none"
      />
      {LEVELS.map((level, i) => {
        const x = 10 + (i * 380) / (LEVELS.length - 1)
        const reached = reachedLevel && LEVELS.indexOf(reachedLevel) >= i
        return (
          <g key={level}>
            <circle cx={x} cy={20} r={6} fill={reached ? '#2F6B4F' : '#F3F5F1'} stroke="#1B3A4B" strokeWidth="2" />
            <text x={x} y={36} textAnchor="middle" fontFamily="var(--font-plex-mono)" fontSize="10" fill="#1A1D1B">
              {level}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
```

- [ ] **Step 2: Manual verification**

Temporarily render `<LanguageRibbon variant="animated" reachedLevel="B2" />` in `app/page.tsx`, run `npm run dev`, confirm the line draws itself once on load and B2/A1/B1 circles are filled green while C1 stays outlined. Remove the temporary render after confirming (the real home page task wires it in properly).

- [ ] **Step 3: Commit**

```bash
git add components/LanguageRibbon.tsx
git commit -m "Add LanguageRibbon signature component"
```

---

### Task 13: Base UI components

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/Badge.tsx`, `components/ui/Card.tsx`, `components/ui/QuoteBlock.tsx`

- [ ] **Step 1: Button**

Create `components/ui/Button.tsx`:
```tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

const VARIANTS = {
  primary: 'bg-primary text-white hover:opacity-90',
  accent: 'bg-accent text-ink hover:opacity-90',
  ghost: 'bg-transparent text-primary border border-primary hover:bg-primary hover:text-white',
} as const

export function Button({
  href,
  variant = 'primary',
  children,
  type = 'button',
}: {
  href?: string
  variant?: keyof typeof VARIANTS
  children: ReactNode
  type?: 'button' | 'submit'
}) {
  const classes = `inline-block rounded px-5 py-2.5 font-medium transition-colors ${VARIANTS[variant]}`
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={classes}>
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Badge (language level)**

Create `components/ui/Badge.tsx`:
```tsx
export function Badge({ children }: { children: string }) {
  return (
    <span className="inline-block rounded bg-primary/10 text-primary font-mono text-xs px-2 py-1">
      {children}
    </span>
  )
}
```

- [ ] **Step 3: Card**

Create `components/ui/Card.tsx`:
```tsx
import type { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return <div className="border border-muted/40 rounded p-5 bg-white">{children}</div>
}
```

- [ ] **Step 4: QuoteBlock (hero/testimonial)**

Create `components/ui/QuoteBlock.tsx`:
```tsx
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
```

- [ ] **Step 5: Commit**

```bash
git add components/ui
git commit -m "Add base UI components (Button, Badge, Card, QuoteBlock)"
```

---

### Task 14: Header, Footer, root layout wiring

**Files:**
- Create: `components/Header.tsx`, `components/Footer.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Header**

Create `components/Header.tsx`:
```tsx
import Link from 'next/link'

const NAV = [
  { href: '/publications', label: 'Publications' },
  { href: '/offres/examens', label: 'Examens' },
  { href: '/offres/fol', label: 'FOL' },
  { href: '/offres/carrieres', label: 'Recrutement' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  return (
    <header className="border-b border-muted/30">
      <nav className="mx-auto max-w-5xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="font-display text-xl text-primary">
          Académie & Production
        </Link>
        <ul className="flex flex-wrap gap-4 text-sm">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="hover:text-primary">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
```

- [ ] **Step 2: Footer with static LanguageRibbon**

Create `components/Footer.tsx`:
```tsx
import Link from 'next/link'
import { LanguageRibbon } from '@/components/LanguageRibbon'

export function Footer() {
  return (
    <footer className="border-t border-muted/30 mt-16">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <LanguageRibbon variant="static" />
        <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Wire into root layout**

Edit `app/layout.tsx` body:
```tsx
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
// ...keep existing imports/metadata

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Manual verification**

Run `npm run dev`, check every page still renders with header/footer, footer ribbon visible, no console errors, nav links resolve (some will 404 until later tasks — expected at this point).

- [ ] **Step 5: Commit**

```bash
git add components/Header.tsx components/Footer.tsx app/layout.tsx
git commit -m "Add Header/Footer with static ribbon in footer"
```

---

### Task 15: Home page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Build the home page**

Replace `app/page.tsx`:
```tsx
import Image from 'next/image'
import Link from 'next/link'
import { getAllArticles } from '@/lib/content'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { QuoteBlock } from '@/components/ui/QuoteBlock'
import { LanguageRibbon } from '@/components/LanguageRibbon'

export default function HomePage() {
  const articles = getAllArticles().slice(0, 3)

  return (
    <main>
      <section className="mx-auto max-w-5xl px-4 py-16 grid gap-10 md:grid-cols-2 items-center">
        <div>
          <LanguageRibbon variant="animated" reachedLevel="B2" />
          <h1 className="text-3xl md:text-4xl mt-6 mb-4">
            17 jours de formation intensive. 5 métiers accessibles derrière.
          </h1>
          <QuoteBlock
            quote="Je ne pensais pas tenir une conversation de 20 minutes sans bloquer."
            person={{ firstname: 'Fara' }}
            result="poste de support client international"
          />
          <div className="mt-6 flex gap-3">
            <Button href="/offres/carrieres" variant="accent">Déposer mon CV</Button>
            <Button href="/publications" variant="ghost">Lire les publications</Button>
          </div>
        </div>
        <Image
          src="/images/hero-placeholder.jpg"
          alt="Fara, en formation"
          width={480}
          height={560}
          className="rounded object-cover w-full h-auto"
        />
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl mb-8">Ce qu'on fait</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="text-xl mb-2">Académie</h3>
            <p>
              Préparation aux examens internationaux et programme FOL pour professionnels.
              On sélectionne, on forme, on teste — pas de diplôme sans niveau réel derrière.
            </p>
          </Card>
          <Card>
            <h3 className="text-xl mb-2">Production B2B</h3>
            <p>
              Des agents formés, mis à disposition pour des centres d'appels et clients
              internationaux, avec une infrastructure fiable (électricité, connexion, supervision).
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl mb-8">Publications récentes</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.slug} href={`/publications/${article.slug}`}>
              <Card>
                <p className="font-mono text-xs text-muted mb-2">{article.category}</p>
                <h3 className="text-lg mb-2">{article.title}</h3>
                <p className="text-sm text-muted">{article.excerpt}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl mb-8">Nos offres</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <h3 className="text-lg mb-2">Examens internationaux</h3>
            <p className="text-sm text-muted mb-4">Préparation ciblée par niveau, du A2 au C1.</p>
            <Button href="/offres/examens" variant="ghost">Voir la préparation aux examens</Button>
          </Card>
          <Card>
            <h3 className="text-lg mb-2">Programme FOL</h3>
            <p className="text-sm text-muted mb-4">Français oratoire pour professionnels et leaders.</p>
            <Button href="/offres/fol" variant="ghost">Voir le programme FOL</Button>
          </Card>
          <Card>
            <h3 className="text-lg mb-2">Vous cherchez du travail ?</h3>
            <p className="text-sm text-muted mb-4">Déposez votre candidature, on vous recontacte.</p>
            <Button href="/offres/carrieres" variant="accent">Déposer mon CV</Button>
          </Card>
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Add the placeholder hero image**

Add a neutral placeholder JPEG at `public/images/hero-placeholder.jpg` (any royalty-free portrait-orientation placeholder image, compressed under 150KB — exact sourcing is a content task, not a code task, flag it in the PR description as "replace before real launch").

- [ ] **Step 3: Manual verification (required for UI work)**

Run `npm run dev`, open `http://localhost:3000` in a browser at a mobile viewport (375px) and desktop viewport. Confirm: ribbon draws once on load and doesn't retrigger on scroll, hero image and quote are legible on mobile, the three offer cards stack on mobile and sit in a 3-column grid on desktop, no default Tailwind colors visible (inspect computed styles if unsure).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx public/images/hero-placeholder.jpg
git commit -m "Build home page"
```

---

### Task 16: Publications list + article page + comments UI

**Files:**
- Create: `app/publications/page.tsx`
- Create: `app/publications/[slug]/page.tsx`
- Create: `components/CommentForm.tsx`, `components/CommentList.tsx`
- Create: 2 more seed articles

- [ ] **Step 1: Add two more seed articles**

Create `content/articles/preparer-toeic-en-6-semaines.mdx`:
```mdx
---
title: "Préparer le TOEIC en 6 semaines : ce qui marche vraiment"
slug: "preparer-toeic-en-6-semaines"
excerpt: "Trois habitudes qui font gagner des points au TOEIC, testées sur nos dernières promotions."
author_firstname: "Njaka"
published_at: "2026-04-02"
category: "conseils langue"
cover_image: "/images/articles/toeic.jpg"
---

Trois choses qui changent vraiment un score TOEIC en six semaines : s'entraîner
à l'oral tous les jours même 15 minutes, arrêter de traduire mot à mot en tête,
et faire des tests blancs chronométrés dès la deuxième semaine — pas la dernière.
```

Create `content/articles/nouvelle-promotion-fol.mdx`:
```mdx
---
title: "Nouvelle promotion FOL : 18 professionnels, quatre secteurs"
slug: "nouvelle-promotion-fol"
excerpt: "Le programme Français Oratoire des Leaders démarre sa quatrième session ce mois-ci."
author_firstname: "Hery"
published_at: "2026-06-01"
category: "actus académie"
cover_image: "/images/articles/fol-promotion.jpg"
---

La quatrième promotion du programme FOL réunit 18 professionnels venus de la banque,
de la santé, du tourisme et de l'énergie. Douze semaines de prise de parole en public,
d'argumentation et de gestion des questions difficiles en français.
```

- [ ] **Step 2: Publications list page**

Create `app/publications/page.tsx`:
```tsx
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
```

- [ ] **Step 3: CommentList (client, fetches approved comments)**

Create `components/CommentList.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import type { CommentDTO } from '@/lib/types'

export function CommentList({ articleSlug, refreshKey }: { articleSlug: string; refreshKey: number }) {
  const [comments, setComments] = useState<CommentDTO[]>([])

  useEffect(() => {
    fetch(`/api/comments?articleSlug=${articleSlug}`)
      .then((res) => res.json())
      .then(setComments)
  }, [articleSlug, refreshKey])

  if (comments.length === 0) {
    return <p className="text-sm text-muted">Aucun commentaire pour l'instant.</p>
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
```

- [ ] **Step 4: CommentForm (client, draft-saved, posts pending comment)**

Create `components/CommentForm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useDraftSave } from '@/lib/useDraftSave'
import { Button } from '@/components/ui/Button'

export function CommentForm({ articleSlug, onSubmitted }: { articleSlug: string; onSubmitted: () => void }) {
  const { draft, setDraft, clearDraft } = useDraftSave(`comment:${articleSlug}`, { firstName: '', body: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    await fetch('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ articleSlug, ...draft }),
    })
    clearDraft()
    setStatus('sent')
    onSubmitted()
  }

  if (status === 'sent') {
    return <p className="text-success">Merci, ton commentaire est en attente de modération.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md">
      <input
        value={draft.firstName}
        onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
        placeholder="Ton prénom"
        required
        className="border border-muted rounded px-3 py-2"
      />
      <textarea
        value={draft.body}
        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        placeholder="Ton commentaire"
        required
        rows={3}
        className="border border-muted rounded px-3 py-2"
      />
      <Button type="submit" variant="accent">
        {status === 'sending' ? 'Envoi...' : 'Publier mon commentaire'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 5: Article page wiring MDX rendering + comments**

Create `app/publications/[slug]/page.tsx`:
```tsx
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
```

- [ ] **Step 6: CommentSection (client wrapper tying form + list + refresh)**

Create `components/CommentSection.tsx`:
```tsx
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
```
Note: a freshly submitted comment is `pending`, so it will not appear in the list immediately after `onSubmitted` triggers a refresh — that's correct behavior per the moderation flow, not a bug. The success message in `CommentForm` already communicates this ("en attente de modération").

- [ ] **Step 7: Install Tailwind Typography for the `prose` class used in Step 5**

Run: `npm install -D @tailwindcss/typography`
Edit `tailwind.config.ts`, add `plugins: [require('@tailwindcss/typography')]`.

- [ ] **Step 8: Manual verification**

Run `npm run dev`, visit `/publications`, click into an article, submit a test comment, confirm it does NOT appear (pending), then approve it via `/admin`, refresh the article page, confirm it now appears. Check mobile viewport for the article page and comment form.

- [ ] **Step 9: Commit**

```bash
git add content/articles app/publications components/CommentForm.tsx components/CommentList.tsx components/CommentSection.tsx tailwind.config.ts package.json
git commit -m "Add publications list, article page, and moderated comments UI"
```

---

### Task 17: Offer pages (examens, FOL, carrières)

**Files:**
- Create: `app/offres/examens/page.tsx`
- Create: `app/offres/fol/page.tsx`
- Create: `app/offres/carrieres/page.tsx`

- [ ] **Step 1: Examens page**

Create `app/offres/examens/page.tsx`:
```tsx
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default function ExamensPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl mb-4">Préparation aux examens internationaux</h1>
      <p className="mb-6">
        On prépare aux examens qui ouvrent des portes concrètes : TOEIC, IELTS, Cambridge.
        Pas de bachotage générique — chaque groupe est construit autour du niveau réel des élèves.
      </p>
      <div className="flex gap-2 mb-8">
        <Badge>A2</Badge>
        <Badge>B1</Badge>
        <Badge>B2</Badge>
        <Badge>C1</Badge>
      </div>
      <h2 className="text-xl mb-2">Durée et rythme</h2>
      <p className="mb-6">
        Sessions intensives de 3 à 6 semaines selon le niveau de départ et l'examen visé.
        Cours en présentiel, groupes de 8 élèves maximum, tests blancs chronométrés dès la
        deuxième semaine.
      </p>
      <Button href="/contact" variant="accent">Demander les prochaines dates</Button>
    </main>
  )
}
```

- [ ] **Step 2: FOL page**

Create `app/offres/fol/page.tsx`:
```tsx
import { Button } from '@/components/ui/Button'

export default function FolPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl mb-4">Programme FOL — Français Oratoire des Leaders</h1>
      <p className="mb-6">
        Un programme pour les professionnels qui doivent convaincre en français : prise de
        parole en public, argumentation face à des objections, gestion des questions
        difficiles en réunion ou en conférence.
      </p>
      <h2 className="text-xl mb-2">Pour qui</h2>
      <p className="mb-6">
        Cadres, responsables d'équipe, porteurs de projet — déjà à l'aise à l'oral, qui
        veulent gagner en impact plutôt qu'en vocabulaire.
      </p>
      <h2 className="text-xl mb-2">Format</h2>
      <p className="mb-6">
        Douze semaines, un groupe restreint par session, mises en situation filmées et
        débriefées individuellement.
      </p>
      <Button href="/contact" variant="accent">Demander un entretien d'admission</Button>
    </main>
  )
}
```

- [ ] **Step 3: Carrières page (CTA only, no back-office)**

Create `app/offres/carrieres/page.tsx`:
```tsx
import { LanguageRibbon } from '@/components/LanguageRibbon'
import { Button } from '@/components/ui/Button'

export default function CarrieresPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <LanguageRibbon variant="static" />
      <h1 className="text-3xl mt-6 mb-4">Vous cherchez du travail ?</h1>
      <p className="mb-6">
        On recrute des agents formés pour des clients internationaux. La sélection se fait
        sur le niveau de langue réel, pas sur le diplôme affiché. Si tu es déjà à l'aise à
        l'oral, ou prêt à te former, dépose ta candidature.
      </p>
      <p className="mb-8 text-sm text-muted">
        Le dépôt de candidature (CV, test de niveau) ouvre bientôt directement sur ce site.
        En attendant, contacte-nous.
      </p>
      <Button href="/contact" variant="accent">Déposer ma candidature</Button>
    </main>
  )
}
```

- [ ] **Step 4: Manual verification**

Visit all three `/offres/*` pages on mobile and desktop, confirm CTAs point to `/contact`, confirm nothing hints at a recruitment back-office beyond the one disclosure sentence on the careers page.

- [ ] **Step 5: Commit**

```bash
git add app/offres
git commit -m "Add examens, FOL, and carrieres offer pages"
```

---

### Task 18: Contact page + À propos

**Files:**
- Create: `app/contact/page.tsx`
- Create: `components/ContactForm.tsx`
- Create: `app/a-propos/page.tsx`

- [ ] **Step 1: ContactForm (draft-saved)**

Create `components/ContactForm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useDraftSave } from '@/lib/useDraftSave'
import { Button } from '@/components/ui/Button'

const EMPTY = { firstName: '', email: '', subject: '', body: '' }

export function ContactForm() {
  const { draft, setDraft, clearDraft } = useDraftSave('contact', EMPTY)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const res = await fetch('/api/contact', { method: 'POST', body: JSON.stringify(draft) })
    if (res.ok) {
      clearDraft()
      setStatus('sent')
    } else {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return <p className="text-success">Message envoyé. On te répond directement.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md">
      <input
        value={draft.firstName}
        onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
        placeholder="Prénom"
        required
        className="border border-muted rounded px-3 py-2"
      />
      <input
        type="email"
        value={draft.email}
        onChange={(e) => setDraft({ ...draft, email: e.target.value })}
        placeholder="Email"
        required
        className="border border-muted rounded px-3 py-2"
      />
      <input
        value={draft.subject}
        onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
        placeholder="Sujet"
        required
        className="border border-muted rounded px-3 py-2"
      />
      <textarea
        value={draft.body}
        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        placeholder="Message"
        required
        rows={4}
        className="border border-muted rounded px-3 py-2"
      />
      {status === 'error' && <p className="text-accent text-sm">Erreur, réessaie.</p>}
      <Button type="submit" variant="accent">
        {status === 'sending' ? 'Envoi...' : 'Envoyer le message'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Contact page**

Create `app/contact/page.tsx`:
```tsx
import { ContactForm } from '@/components/ContactForm'

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl mb-4">Contact</h1>
      <p className="mb-8">
        Une question sur une formation, un projet de staffing, ou autre chose : écris-nous,
        on répond directement.
      </p>
      <ContactForm />
    </main>
  )
}
```

- [ ] **Step 3: À propos page**

Create `app/a-propos/page.tsx`:
```tsx
export default function AProposPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl mb-4">À propos</h1>
      <p className="mb-6">
        On forme des gens à Madagascar, sur des compétences qui ouvrent des portes vite :
        des langues, et le métier derrière. Deux activités, un même fil : la sélection est
        stricte, la formation est concrète, et le niveau atteint se vérifie, pas se déclare.
      </p>
      <p className="mb-6">
        L'académie prépare aux examens internationaux et anime le programme FOL pour
        professionnels. En parallèle, on met à disposition des agents formés pour des
        centres d'appels et des clients internationaux, avec une infrastructure fiable sur
        place — électricité, connexion, supervision.
      </p>
      <p>
        On est basés à Madagascar et on travaille avec des clients à l'international.
      </p>
    </main>
  )
}
```

- [ ] **Step 4: Manual verification**

Fill the contact form partway, reload the page, confirm the draft restores (draft-save working), then submit and confirm it appears in `/admin`.

- [ ] **Step 5: Commit**

```bash
git add app/contact components/ContactForm.tsx app/a-propos
git commit -m "Add contact page with draft-saved form, and about page"
```

---

### Task 19: Legal pages

**Files:**
- Create: `app/mentions-legales/page.tsx`
- Create: `app/confidentialite/page.tsx`

- [ ] **Step 1: Mentions légales (placeholders clearly marked)**

Create `app/mentions-legales/page.tsx`:
```tsx
export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 prose prose-neutral">
      <h1>Mentions légales</h1>
      <p><strong>Raison sociale :</strong> [à compléter]</p>
      <p><strong>Forme juridique :</strong> [à compléter]</p>
      <p><strong>NIF / Stat :</strong> [à compléter]</p>
      <p><strong>Adresse (Madagascar) :</strong> [à compléter]</p>
      <p><strong>Directeur de la publication :</strong> [à compléter]</p>
      <p><strong>Hébergeur :</strong> [à compléter une fois l'hébergement choisi]</p>
      <p><strong>Contact :</strong> voir la page <a href="/contact">Contact</a>.</p>
    </main>
  )
}
```

- [ ] **Step 2: Politique de confidentialité (covers CV/vidéos handling)**

Create `app/confidentialite/page.tsx`:
```tsx
export default function ConfidentialitePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 prose prose-neutral">
      <h1>Politique de confidentialité</h1>
      <p>
        Cette page décrit comment on traite tes données quand tu utilises ce site :
        commentaires, formulaire de contact, et — dans une phase ultérieure — dépôt de
        CV ou de vidéos de candidature.
      </p>
      <h2>Commentaires</h2>
      <p>
        Seul ton prénom est affiché publiquement. Chaque commentaire est relu avant
        publication et n'est jamais visible tant qu'il n'est pas approuvé.
      </p>
      <h2>Formulaire de contact</h2>
      <p>
        Ton prénom, ton email et ton message sont stockés pour qu'on puisse te répondre.
        Ils ne sont ni publiés, ni transmis à un tiers.
      </p>
      <h2>CV et vidéos de candidature (à venir)</h2>
      <p>
        Quand le module de candidature sera en ligne, cette section décrira précisément
        la durée de conservation et l'usage fait des CV et vidéos soumis. [à compléter
        avant la mise en ligne du module de recrutement]
      </p>
      <h2>Contact</h2>
      <p>Pour toute question sur tes données : voir la page <a href="/contact">Contact</a>.</p>
    </main>
  )
}
```

- [ ] **Step 3: Manual verification**

Visit both pages, confirm `[à compléter]` markers are visible and readable (they're meant to be conspicuous, not hidden).

- [ ] **Step 4: Commit**

```bash
git add app/mentions-legales app/confidentialite
git commit -m "Add legal and privacy pages with marked placeholders"
```

---

### Task 20: README + full DoD pass

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

Create `README.md`:
```markdown
# Site vitrine — Académie & Production (Madagascar)

## Stack
Next.js 14 (App Router) + TypeScript + Tailwind + Prisma (Postgres/Neon).

## Mise en route

1. `npm install`
2. Copier `.env.example` en `.env`, remplir :
   - `DATABASE_URL` : connexion Postgres (ex. Neon, https://neon.tech)
   - `ADMIN_PASSWORD_HASH` : générer avec
     `node -e "require('bcryptjs').hash(process.argv[1], 10).then(console.log)" "ton-mot-de-passe"`
   - `SESSION_SECRET` : générer avec
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. `npx prisma migrate dev --name init`
4. `npm run dev`

## Tests
`npm test`

## Contenu
Les articles sont des fichiers MDX dans `content/articles/`. Ajouter un fichier suffit,
pas besoin de redéployer de code pour publier un nouvel article (juste le fichier + un
build/déploiement).

## Avant la mise en ligne réelle
- Compléter les mentions légales et la politique de confidentialité (`[à compléter]`).
- Remplacer les images placeholder par de vraies photos (prénom uniquement, jamais de nom
  de famille dans les métadonnées d'image ou l'alt text).
- Choisir l'hébergement (portable entre Vercel et Cloudflare Pages/Workers).
```

- [ ] **Step 2: Full DoD verification pass**

Run `npm test` — expect all suites passing.
Run `npm run build` — expect a clean production build with no type errors.
Run `npm run dev`, walk every route on a 375px mobile viewport and a desktop viewport:
`/`, `/publications`, `/publications/decroche-poste-apres-17-jours`, `/offres/examens`,
`/offres/fol`, `/offres/carrieres`, `/a-propos`, `/contact`, `/mentions-legales`,
`/confidentialite`, `/admin/login`, `/admin`.
Confirm against the spec's Definition of Done (section 11): custom theme only, prénom-only
everywhere, ribbon used only in home hero + footer + careers header (no scroll fade-ins
anywhere), all copy matches the tone guide, comment/contact drafts survive a reload.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Add README and finish Phase 1 DoD verification pass"
```
