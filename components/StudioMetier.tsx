'use client'
import { useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { RegistrationForm } from '@/components/RegistrationForm'
import { FoldCard, type Tone } from '@/components/CardBits'
import {
  IconChat,
  IconHandshake,
  IconHeadset,
  IconMail,
  IconMegaphone,
  IconMic,
  IconPen,
  IconTarget,
} from '@/components/Icons'

type Metier = {
  slug: string
  title: string
  description: string
  icon: ReactNode
  tone: Tone
}

const LONG_TERME: Metier[] = [
  {
    slug: 'teleconseiller',
    title: 'Téléconseiller',
    description:
      'Vous maîtrisez l’art de l’écoute ? Prenez en charge la gestion des flux avec une aisance verbale irréprochable.',
    icon: <IconHeadset />,
    tone: 'primary',
  },
  {
    slug: 'setter',
    title: 'Setter',
    description:
      'Vous avez le sens du contact et un tempérament de prospecteur ? Spécialisez-vous dans l’approche ciblée.',
    icon: <IconTarget />,
    tone: 'success',
  },
  {
    slug: 'closer',
    title: 'Closer',
    description:
      'Vous possédez l’étoffe d’un fin négociateur ? Prenez le relais pour mener à bien les signatures de contrats.',
    icon: <IconHandshake />,
    tone: 'accent',
  },
  {
    slug: 'support-emailing',
    title: 'Agent support émailing',
    description:
      'Vous brillez par votre rigueur écrite et votre rapidité ? Prenez en charge le traitement des requêtes.',
    icon: <IconMail />,
    tone: 'primary',
  },
  {
    slug: 'conseiller-chat',
    title: 'Conseiller chat / support digital',
    description:
      'Vous aimez le dynamisme des échanges en direct ? Intervenez en temps réel sur les plateformes de messagerie.',
    icon: <IconChat />,
    tone: 'success',
  },
]

const COURT_TERME: Metier[] = [
  {
    slug: 'voix-off',
    title: 'Voix off & habillage sonore',
    description:
      'Vous avez une voix magnétique et une diction parfaite ? Prêtez votre voix pour captiver votre auditoire.',
    icon: <IconMic />,
    tone: 'accent',
  },
  {
    slug: 'community-manager',
    title: 'Community manager',
    description:
      'Vous savez fédérer et créer de l’engagement ? Animez et faites croître la présence des marques avec créativité.',
    icon: <IconMegaphone />,
    tone: 'primary',
  },
  {
    slug: 'teleconseiller-campagne-courte',
    title: 'Téléconseiller (campagne courte)',
    description:
      'Vous aimez relever des défis rythmés sur des durées resserrées ? Intervenez sur des opérations ponctuelles.',
    icon: <IconHeadset />,
    tone: 'success',
  },
  {
    slug: 'setter-prospection-digitale',
    title: 'Setter & prospection digitale',
    description:
      'Vous maniez la prospection numérique avec brio ? Initiez des contacts qualifiés lors de sprints courts.',
    icon: <IconTarget />,
    tone: 'accent',
  },
  {
    slug: 'redacteur-web',
    title: 'Rédacteur web & stratégie d’écriture',
    description:
      'Vous avez la plume affûtée et percutante ? Créez des contenus textuels à forte valeur ajoutée.',
    icon: <IconPen />,
    tone: 'primary',
  },
]

export function StudioMetier() {
  const [selected, setSelected] = useState<Metier | null>(null)
  const [showForm, setShowForm] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  function selectMetier(m: Metier) {
    setSelected(m)
    setShowForm(false)
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function renderGroup(title: string, subtitle: string, metiers: Metier[]) {
    return (
      <div className="mb-10">
        <h3 className="mb-1 text-lg md:text-xl">{title}</h3>
        <p className="mb-5 text-sm text-muted">{subtitle}</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {metiers.map((m) => (
            <FoldCard
              key={m.slug}
              tone={m.tone}
              icon={m.icon}
              title={m.title}
              description={m.description}
              actionLabel="Découvrir ce métier"
              active={selected?.slug === m.slug}
              onClick={() => selectMetier(m)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {renderGroup(
        'Vos missions à long terme',
        'Engagement pérenne, montée en compétences.',
        LONG_TERME
      )}
      {renderGroup(
        'Vos missions à court terme',
        'Projets rythmés, polyvalence, expertises créatives.',
        COURT_TERME
      )}

      {selected && (
        <div
          ref={panelRef}
          className="rounded-2xl border border-primary/15 bg-white p-6 shadow-sm md:p-8"
        >
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-accent">
            Métier sélectionné
          </p>
          <h3 className="mb-6 text-xl md:text-2xl">{selected.title}</h3>

          <h4 className="mb-2 font-display text-lg italic">
            Un test sans risque, une opportunité pour grandir.
          </h4>
          <p className="mb-3 text-sm text-muted">
            Ne voyez pas ce test comme un couperet, mais comme un tremplin. Si vous ne
            validez pas immédiatement le niveau C1 requis, aucun rejet : vous bénéficierez
            d&apos;un accompagnement sur-mesure pour booster et élever vos compétences
            linguistiques.
          </p>
          <p className="mb-3 text-sm text-muted">
            Si vous obtenez un niveau C1 ou plus : Vous accédez directement au cercle
            restreint. Votre parcours s&apos;articulera autour de 10 jours de formation
            intensive pour parfaire votre posture, votre éloquence et les codes de
            l&apos;excellence, complétés par 5 jours de formation offerts par notre
            partenaire.
          </p>
          <p className="mb-3 text-sm text-muted">
            Attention : Ces opportunités demandent un engagement total. Vous aurez la
            responsabilité de piloter et d&apos;organiser rigoureusement votre planning
            pour concilier ces temps de formation et vos missions.
          </p>
          <p className="mb-6 text-sm text-muted">
            Êtes-vous prêt à relever le défi et à valider votre position ?
          </p>

          {!showForm ? (
            <Button variant="accent" onClick={() => setShowForm(true)}>
              Passer votre test
            </Button>
          ) : (
            <div className="border-t border-muted/30 pt-6">
              <p className="mb-1 font-mono text-xs uppercase tracking-widest text-accent">
                Avant de passer le test
              </p>
              <h4 className="mb-4 text-lg">Vos coordonnées</h4>
              <RegistrationForm
                segment={selected.slug}
                ctaLabel={`Passer mon test — ${selected.title}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
