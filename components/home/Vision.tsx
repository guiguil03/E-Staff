import type { ReactNode } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import {
  BadgeDiplomaIcon,
  DoveIcon,
  GearPairIcon,
  HandshakeIcon,
  MicrophoneIcon,
  StarPersonIcon,
  TeamGrowthIcon,
} from "@/components/icons/HomeIcons";

interface VisionCardProps {
  href: string;
  accent: "success" | "teal";
  icon: ReactNode;
  children: ReactNode;
}

// A thin vertical "hanging wire" above an icon or card — the same gallery
// motif used for the media wall on /communaute, applied here so the two
// columns read as hanging from the banner above, per the reference mockup.
function HangingWire() {
  return (
    <div aria-hidden="true" className="flex w-px flex-col items-center">
      <span className="h-6 w-px bg-accent/40 sm:h-8" />
      <span className="-mt-0.5 h-1.5 w-1.5 rounded-full bg-accent/60" />
    </div>
  );
}

function VisionCard({ href, accent, icon, children }: VisionCardProps) {
  const accentBg = accent === "success" ? "bg-success" : "bg-teal";
  const accentText = accent === "success" ? "text-success" : "text-teal";

  return (
    <div className="flex flex-col items-center">
      <HangingWire />
      <Link
        href={href}
        className="group relative mt-1 flex w-full flex-col items-center gap-4 overflow-hidden rounded border border-accent/20 bg-obsidianCard p-6 text-center shadow-lg shadow-black/30 transition-colors hover:border-accent/50"
      >
        <span
          aria-hidden="true"
          className={`absolute -left-8 -top-8 h-16 w-16 rotate-45 ${accentBg} opacity-90`}
        />
        <span className={`relative z-10 mt-2 h-9 w-9 ${accentText}`}>{icon}</span>
        <p className="relative z-10 font-sans text-sm font-medium text-white">{children}</p>
      </Link>
    </div>
  );
}

function CenterConnector() {
  return (
    <div
      aria-hidden="true"
      className="hidden md:col-start-2 md:row-start-2 md:flex md:items-center md:justify-center md:self-center md:justify-self-center"
    >
      <div className="relative flex h-40 w-40 items-center justify-center">
        <span className="absolute inset-x-0 top-1/2 border-t-2 border-dotted border-teal/50" />
        <span className="absolute inset-y-0 left-1/2 border-l-2 border-dotted border-teal/50" />
        <span className="absolute h-20 w-20 rounded-full bg-teal/25 blur-xl" />
        <span className="relative z-10 flex h-12 w-12 items-center justify-center">
          <HandshakeIcon className="h-10 w-10 text-white drop-shadow-[0_0_6px_rgba(27,138,154,0.75)]" />
        </span>
      </div>
    </div>
  );
}

export default function Vision() {
  return (
    <section className="bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-b-[120px] border border-t-0 border-accent/25 bg-obsidianCard px-6 pb-12 pt-8 text-center shadow-lg shadow-black/40 sm:max-w-lg sm:rounded-b-[160px] sm:pb-16">
            <h2 className="bg-gradient-to-b from-accent to-accent/60 bg-clip-text font-display text-3xl font-bold uppercase tracking-wide text-transparent sm:text-4xl">
              Notre vision
            </h2>
            <p className="mt-3 font-sans text-sm text-white/80 sm:text-base">
              Le Cœur de Notre Engagement
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto mt-14 max-w-3xl space-y-4 text-center font-sans text-white/80 sm:mt-16">
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
              <HangingWire />
              <DoveIcon className="mt-1 h-12 w-12 text-success sm:h-14 sm:w-14" />
              <h3 className="mt-3 font-display text-2xl font-bold text-white">
                Du côté des <span className="text-success">Talents</span>
              </h3>
              <p className="mt-3 max-w-sm font-sans text-sm text-white/60">
                Nous portons des accompagnements sur-mesure pour révéler le meilleur de chacun, en
                toute autonomie :
              </p>
            </div>
          </Reveal>

          {/* Carte "Postuler à un métier" (/offres/carrieres) retirée le
              2026-09-05 — Studio Métier masqué le temps de trouver du
              contenu à y mettre, voir app/offres/carrieres/page.tsx. */}
          <Reveal className="md:col-start-1 md:row-start-2">
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
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
            </div>
          </Reveal>

          <CenterConnector />

          <Reveal delay={100} className="md:col-start-3 md:row-start-1">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <HangingWire />
              <GearPairIcon className="mt-1 h-12 w-12 text-teal sm:h-14 sm:w-14" />
              <h3 className="mt-3 font-display text-2xl font-bold text-white">
                Du côté des <span className="text-teal">Entreprises</span>
              </h3>
              <p className="mt-3 max-w-sm font-sans text-sm text-white/60">
                Nous offrons un prolongement naturel à cette exigence humaine. Qu&apos;il
                s&apos;agisse de recruter nos talents certifiés ou de former vos propres équipes en
                interne (montée en compétences), nous vous garantissons des collaborateurs
                managés avec rigueur et des infrastructures sécurisées pour vous permettre de
                grandir en toute confiance.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100} className="md:col-start-3 md:row-start-2">
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
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
              <VisionCard
                href="/entreprises/former-son-equipe"
                accent="teal"
                icon={<TeamGrowthIcon className="h-full w-full" />}
              >
                Former son équipe
              </VisionCard>
            </div>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <div className="mx-auto mt-14 max-w-2xl text-center font-sans font-semibold text-white sm:mt-16">
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
