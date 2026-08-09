"use client";

import { useRef, useState } from "react";
import Reveal from "@/components/Reveal";
import RegistrationForm from "@/components/RegistrationForm";
import AccessNotice from "@/components/studio-metier/AccessNotice";
import CircuitTexture from "@/components/studio-metier/CircuitTexture";
import MetierColumn from "@/components/studio-metier/MetierColumn";
import {
  ALL_METIERS,
  LONG_TERM_METIERS,
  SHORT_TERM_METIERS,
} from "@/components/studio-metier/data";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Dark/elite "Studio Métier" universe — deliberately distinct from the rest
// of the site (near-black + gold), matching the FOL sub-brand. Built
// standalone here; only components/studio-metier/* and this page are new.
export default function StudioMetier() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const candidatureRef = useRef<HTMLDivElement>(null);

  const selected = ALL_METIERS.find((metier) => metier.slug === selectedSlug) ?? null;

  function scrollTo(ref: React.RefObject<HTMLElement>) {
    ref.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }

  function handleSelect(slug: string) {
    setSelectedSlug(slug);
    // Wait a tick so the registration section has re-rendered before scrolling.
    requestAnimationFrame(() => scrollTo(candidatureRef));
  }

  function handleBottomCta() {
    scrollTo(selectedSlug ? candidatureRef : gridRef);
  }

  return (
    <div className="relative overflow-hidden bg-obsidian">
      <CircuitTexture />

      <div className="relative">
        {/* Pitch */}
        <section className="px-4 pb-4 pt-16 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                e-Staf — Studio Métier
              </p>
              <h1 className="mt-4 font-display text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
                Votre carrière de rêve en quelques clics.
              </h1>
              <p className="mt-5 font-sans text-base leading-relaxed text-white/70 sm:text-lg">
                Vous êtes un(e) professionnel(le) conscient(e) que la seule
                barrière entre vous et votre carrière rêvée, c&apos;est la
                maîtrise de la langue&nbsp;? Marre de suivre des cours
                théoriques de gauche à droite&nbsp;? Vous savez pertinemment
                ce qu&apos;il vous faut&nbsp;: une réelle montée en
                compétences pour aligner vos diplômes et votre expertise aux
                besoins exigeants du marché du travail actuel.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-8">
                <AccessNotice />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Job list */}
        <section ref={gridRef} className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="font-display text-2xl font-black uppercase leading-tight text-accent sm:text-3xl md:text-4xl">
                Vous avez du talent, et votre trajectoire mérite
                l&apos;excellence.
              </h2>
              <p className="mt-3 max-w-3xl font-sans text-sm text-white/70 sm:text-base">
                Explorez vos options, écoutez vos aspirations, et faites le
                choix qui transformera votre potentiel en réussite.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-10 md:grid-cols-[1fr_auto_1fr] md:gap-8">
              <MetierColumn
                title="Vos missions à long terme"
                intro="Vous recherchez un engagement pérenne, une montée en compétences, et une intégration de fond ? C'est ici que vous construisez votre carrière."
                metiers={LONG_TERM_METIERS}
                selectedSlug={selectedSlug}
                onSelect={handleSelect}
                delayBase={0}
              />

              <div
                aria-hidden="true"
                className="hidden self-stretch justify-self-center md:block md:w-px md:bg-gradient-to-b md:from-transparent md:via-accent/50 md:to-transparent"
              />

              <MetierColumn
                title="Vos missions à court terme"
                intro="Vous préférez l'émulation des projets rythmés, la polyvalence, et l'expression de vos expertises créatives ? Exprimez votre talent ici."
                metiers={SHORT_TERM_METIERS}
                selectedSlug={selectedSlug}
                onSelect={handleSelect}
                delayBase={80}
              />
            </div>
          </div>
        </section>

        {/* Registration */}
        <section ref={candidatureRef} className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <Reveal>
              {selected ? (
                <>
                  <p className="text-center font-mono text-xs uppercase tracking-widest text-accent">
                    Votre choix
                  </p>
                  <h3 className="mt-2 text-center font-display text-xl font-bold text-white sm:text-2xl">
                    {selected.title}
                  </h3>
                  <p className="mt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedSlug(null)}
                      className="font-sans text-sm text-white/60 underline decoration-accent/40 underline-offset-4 hover:text-accent"
                    >
                      Choisir un autre métier
                    </button>
                  </p>
                  <div className="mt-6">
                    <RegistrationForm
                      segment={selected.slug}
                      tone="dark"
                      ctaLabel="Envoyer ma candidature"
                    />
                  </div>
                </>
              ) : (
                <div className="rounded border border-white/10 bg-obsidianCard px-6 py-10 text-center">
                  <p className="font-display text-lg font-semibold text-white">
                    Choisissez d&apos;abord votre voie
                  </p>
                  <p className="mt-2 font-sans text-sm text-white/60">
                    Sélectionnez un métier ci-dessus pour démarrer votre
                    candidature.
                  </p>
                </div>
              )}
            </Reveal>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto flex max-w-6xl justify-center">
            <button
              type="button"
              onClick={handleBottomCta}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 font-sans text-sm font-bold uppercase tracking-wide text-obsidian shadow-[0_0_30px_rgba(184,151,62,0.35)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Choisir ma voie et soulever ma candidature
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
