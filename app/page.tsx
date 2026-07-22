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
        <h2 className="text-2xl mb-8">Ce qu&apos;on fait</h2>
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
              Des agents formés, mis à disposition pour des centres d&apos;appels et clients
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
