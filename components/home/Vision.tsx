import type { ReactNode } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import {
  BadgeDiplomaIcon,
  BriefcaseIcon,
  DoveIcon,
  GearPairIcon,
  HandshakeIcon,
  MicrophoneIcon,
  StarPersonIcon,
} from "@/components/icons/HomeIcons";

interface VisionCardProps {
  href: string;
  accent: "success" | "teal";
  icon: ReactNode;
  children: ReactNode;
}

function VisionCard({ href, accent, icon, children }: VisionCardProps) {
  const accentBg = accent === "success" ? "bg-success" : "bg-teal";
  const accentText = accent === "success" ? "text-success" : "text-teal";

  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center gap-4 overflow-hidden rounded border border-primary/10 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
    >
      <span
        aria-hidden="true"
        className={`absolute -left-8 -top-8 h-16 w-16 rotate-45 ${accentBg} opacity-90`}
      />
      <span className={`relative z-10 mt-2 h-9 w-9 ${accentText}`}>{icon}</span>
      <p className="relative z-10 font-sans text-sm font-medium text-primary">{children}</p>
    </Link>
  );
}

function CenterConnector() {
  return (
    <div
      aria-hidden="true"
      className="hidden md:col-start-2 md:row-start-2 md:flex md:items-center md:justify-center md:self-center md:justify-self-center"
    >
      <div className="relative flex h-36 w-36 items-center justify-center">
        <span className="absolute inset-x-0 top-1/2 border-t-2 border-dotted border-primary/20" />
        <span className="absolute inset-y-0 left-1/2 border-l-2 border-dotted border-primary/20" />
        <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-white shadow-sm">
          <HandshakeIcon className="h-6 w-6 text-primary" />
        </span>
      </div>
    </div>
  );
}

export default function Vision() {
  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-b-[120px] bg-primary px-6 pb-12 pt-8 text-center sm:max-w-lg sm:rounded-b-[160px] sm:pb-16">
            <h2 className="bg-gradient-to-b from-accent to-accent/60 bg-clip-text font-display text-3xl font-bold uppercase tracking-wide text-transparent sm:text-4xl">
              Notre vision
            </h2>
            <p className="mt-3 font-sans text-sm text-white/90 sm:text-base">
              Le Cœur de Notre Engagement
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto mt-14 max-w-3xl space-y-4 text-center font-sans text-ink sm:mt-16">
            <p>
              Notre seul et unique objectif, c&apos;est l&apos;impact : permettre à tout un
              chacun de choisir sa trajectoire de vie et de concrétiser ses rêves.
            </p>
            <p>
              C&apos;est pour cela qu&apos;e-Staf est avant tout un espace d&apos;émancipation et
              de révélation du potentiel humain. Au-delà de l&apos;externalisation, nous bâtissons
              un pont solide entre deux ambitions :
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-y-10 sm:mt-16 md:grid-cols-[1fr_auto_1fr] md:grid-rows-[auto_auto] md:items-start md:gap-x-6 md:gap-y-10">
          <Reveal className="md:col-start-1 md:row-start-1">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <DoveIcon className="h-10 w-10 text-success" />
              <h3 className="mt-3 font-display text-2xl font-bold text-primary">
                Du côté des <span className="text-success">Talents</span>
              </h3>
              <p className="mt-3 max-w-sm font-sans text-sm text-muted">
                Nous portons des accompagnements sur-mesure pour révéler le meilleur de chacun, en
                toute autonomie :
              </p>
            </div>
          </Reveal>

          <Reveal className="md:col-start-1 md:row-start-2">
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
              <VisionCard
                href="/offres/examens"
                accent="success"
                icon={<BadgeDiplomaIcon className="h-full w-full" />}
              >
                Se préparer aux examens internationaux
              </VisionCard>
              <VisionCard
                href="/offres/fol"
                accent="success"
                icon={<MicrophoneIcon className="h-full w-full" />}
              >
                Se former aux FOL - Français : Oratoire des Leaders
              </VisionCard>
              <VisionCard
                href="/offres/carrieres"
                accent="success"
                icon={<BriefcaseIcon className="h-full w-full" />}
              >
                Postuler à un métier
              </VisionCard>
            </div>
          </Reveal>

          <CenterConnector />

          <Reveal delay={100} className="md:col-start-3 md:row-start-1">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <GearPairIcon className="h-10 w-10 text-teal" />
              <h3 className="mt-3 font-display text-2xl font-bold text-primary">
                Du côté des <span className="text-teal">Entreprises</span>
              </h3>
              <p className="mt-3 max-w-sm font-sans text-sm text-muted">
                Nous offrons un prolongement naturel à cette exigence humaine. En vous garantissant
                des profils formés, et managés avec rigueur, des infrastructures sécurisées pour
                vous permettre de grandir en toute confiance, en sachant que chaque collaborateur
                qui vous rejoint est un talent pleinement épanoui et prêt à donner le meilleur de
                lui-même.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100} className="md:col-start-3 md:row-start-2">
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              <VisionCard
                href="/communaute"
                accent="teal"
                icon={<StarPersonIcon className="h-full w-full" />}
              >
                Découvrir nos meilleurs talents
              </VisionCard>
              <VisionCard
                href="/entreprises"
                accent="teal"
                icon={<HandshakeIcon className="h-full w-full" />}
              >
                Découvrir nos offres B2B
              </VisionCard>
            </div>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <div className="mx-auto mt-14 max-w-2xl text-center font-sans font-semibold text-primary sm:mt-16">
            <p>Ici, chaque parcours compte. Chaque ambition valorisée et chaque talent accompagné.</p>
            <p className="mt-2">
              Nous sommes là pour grandir ensemble, sans compromis et avec le cœur.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
