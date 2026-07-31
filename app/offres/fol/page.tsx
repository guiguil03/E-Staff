'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { RegistrationForm } from '@/components/RegistrationForm'
import { StepCard, FoldCard } from '@/components/CardBits'
import {
  IconBolt,
  IconBriefcase,
  IconCrown,
  IconHandshake,
  IconSpotlight,
} from '@/components/Icons'

const PROCESSUS = [
  {
    number: 'Étape 1',
    title: 'La Présélection (15 Talents)',
    tone: 'primary' as const,
    body: 'Un premier filtre rigoureux retient seulement 15 profils d’exception pour intégrer 6 semaines d’observation intensive et de mise en situation.',
  },
  {
    number: 'Étape 2',
    title: 'L’Élite (5 Élus)',
    tone: 'accent' as const,
    body: 'À l’issue de cette période probatoire, seuls 5 candidats démontrant la rigueur, le potentiel et l’engagement requis décrocheront leur place pour suivre l’intégralité du coaching de 6 mois.',
  },
] as const

const PILIERS = [
  {
    icon: <IconSpotlight />,
    tone: 'primary' as const,
    title: 'Présenter avec charisme',
    description: 'Captiver instantanément l’audience et habiter l’espace avec impact.',
  },
  {
    icon: <IconCrown />,
    tone: 'success' as const,
    title: 'Diriger avec autorité',
    description: 'Asseoir son leadership par le ton, le rythme et la présence non-verbale.',
  },
  {
    icon: <IconHandshake />,
    tone: 'accent' as const,
    title: 'Négocier avec élégance',
    description: 'Désamorcer les tensions et convaincre par la justesse de l’intonation.',
  },
  {
    icon: <IconBolt />,
    tone: 'primary' as const,
    title: 'Répondre avec brio',
    description: 'Maîtriser la répartie immédiate face aux questions complexes.',
  },
  {
    icon: <IconBriefcase />,
    tone: 'success' as const,
    title: 'Incarner la posture PDG',
    description: 'Adopter les codes de communication de la direction générale.',
  },
] as const

export default function FolPage() {
  const [showForm, setShowForm] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  function openTest() {
    setShowForm(true)
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
        Programme phare de l&apos;académie
      </p>
      <h1 className="mb-2 text-3xl md:text-4xl">
        Français : Oratoire des Leaders (FOL)
      </h1>
      <p className="mb-8 font-display text-xl italic text-muted md:text-2xl">
        L&apos;art de la haute autorité verbale.
      </p>

      <p className="mb-4">
        Le pouvoir d&apos;un grand leader réside au bout de sa voix. Le programme FOL
        n&apos;est pas une formation ouverte à tous : c&apos;est un cursus d&apos;élite de
        six mois conçu pour les esprits audacieux qui refusent de faire de la simple
        figuration.
      </p>

      <h2 className="mb-5 mt-10 text-xl md:text-2xl">
        Un processus d&apos;excellence sans compromis :
      </h2>
      <div className="mb-10 grid gap-5 sm:grid-cols-2">
        {PROCESSUS.map((step) => (
          <StepCard key={step.number} number={step.number} title={step.title} tone={step.tone}>
            {step.body}
          </StepCard>
        ))}
      </div>

      <p className="mb-12">
        Ici, nous ne vous apprenons pas seulement à parler français : nous sculptons votre
        autorité naturelle. Votre voix est votre premier outil de conquête. Ne la subissez
        plus : incarnez-la.
      </p>

      {/* ------------------------------------------------------------ */}
      {/* 5-pillar panel — no real photo exists for the 6-month coaching, */}
      {/* so this is a designed content panel instead of a fabricated one */}
      {/* ------------------------------------------------------------ */}
      <section className="mb-12 border-t border-muted/30 pt-10">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-accent">
          Ce que les 5 Élus apprennent
        </p>
        <h2 className="mb-6 text-xl md:text-2xl">Les 5 piliers du coaching de 6 mois</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILIERS.map((p) => (
            <FoldCard
              key={p.title}
              tone={p.tone}
              icon={p.icon}
              title={p.title}
              description={p.description}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      <section ref={formRef} className="border-t border-muted/30 pt-10">
        {!showForm ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button variant="accent" onClick={openTest}>
              Passer le test
            </Button>
            <p className="text-sm text-muted">
              Coordonnées d&apos;abord, test ensuite — même processus que les autres
              parcours candidats.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-sm md:p-8">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-accent">
              Avant de passer le test
            </p>
            <h2 className="mb-4 text-xl">Vos coordonnées</h2>
            <RegistrationForm segment="fol" ctaLabel="Passer mon test FOL" />
          </div>
        )}
      </section>
    </main>
  )
}
