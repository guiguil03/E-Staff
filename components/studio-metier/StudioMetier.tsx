"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/Reveal";
import RegistrationForm from "@/components/RegistrationForm";
import AccessNotice from "@/components/studio-metier/AccessNotice";
import CircuitTexture from "@/components/studio-metier/CircuitTexture";
import OffreCard from "@/components/studio-metier/OffreCard";
import TemoignagesEmbauche from "@/components/studio-metier/TemoignagesEmbauche";
import type { OffreEmploi } from "@/components/studio-metier/offres";
import { apiGet } from "@/lib/api";
import {
  ALL_METIERS,
  LONG_TERM_METIERS,
  SHORT_TERM_METIERS,
} from "@/components/studio-metier/data";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const ORDRE_STATUT: Record<OffreEmploi["statut"], number> = { presque_complet: 0, ouvert: 1, cloture: 2 };

function HangingPin() {
  return (
    <div aria-hidden="true" className="mx-auto hidden w-px flex-col items-center sm:flex">
      <span className="h-6 w-px bg-accent/40" />
      <span className="-mt-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
    </div>
  );
}

// « Ma carrière » (/offres/carrieres) — univers sombre/élite (obsidienne +
// or). Depuis le 2026-09-26 (demande cliente), la grille des 10 cartes
// métiers est remplacée par la disposition de la page Communauté (mise en
// pause) : à gauche le mur des offres d'emploi publiées par la RH, à droite
// les témoignages de personnes embauchées. La candidature spontanée reste
// possible, avec le choix du métier dans une liste.
export default function StudioMetier() {
  const murRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Offres d'emploi réelles (Portail RH > Offres d'emploi). Une panne de
  // l'API ne doit jamais casser la page : on affiche alors seulement la
  // candidature spontanée.
  const [offres, setOffres] = useState<OffreEmploi[] | null>(null);
  // Offre choisie via « Postuler » / « Rejoindre la liste d'attente », ou
  // candidature spontanée (métier choisi dans la liste).
  const [choix, setChoix] = useState<{ offreId: string; listeAttente: boolean } | "spontanee" | null>(null);
  const [metierSpontane, setMetierSpontane] = useState("");

  useEffect(() => {
    apiGet<OffreEmploi[]>("/offres-emploi")
      .then((data) => setOffres(Array.isArray(data) ? data : []))
      .catch(() => setOffres([]));
  }, []);

  const offresTriees = [...(offres ?? [])].sort((a, b) => ORDRE_STATUT[a.statut] - ORDRE_STATUT[b.statut]);
  const offreChoisie =
    choix && choix !== "spontanee" ? offresTriees.find((o) => o.id === choix.offreId) ?? null : null;
  const listeAttente = choix !== null && choix !== "spontanee" && choix.listeAttente;
  const metierChoisi = ALL_METIERS.find((m) => m.slug === metierSpontane) ?? null;
  const segment = offreChoisie?.metierSlug ?? metierChoisi?.slug ?? null;

  function scrollTo(ref: React.RefObject<HTMLElement>) {
    ref.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }

  function choisir(nouveauChoix: { offreId: string; listeAttente: boolean } | "spontanee") {
    setChoix(nouveauChoix);
    // Attend le rendu du formulaire avant de défiler.
    requestAnimationFrame(() => scrollTo(formRef));
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
                e-Staf — Ma carrière
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

        {/* Mur des offres + témoignages (disposition de la page Communauté) */}
        <section className="mt-12 border-t border-accent/15 px-4 pb-20 pt-12 sm:px-6">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-10">
            <div ref={murRef} aria-labelledby="mur-offres" className="min-w-0 scroll-mt-24">
              <Reveal>
                <h2 id="mur-offres" className="font-display text-2xl font-bold text-accent sm:text-3xl">
                  Le Mur des Offres
                </h2>
                <p className="mt-2 max-w-2xl font-sans text-sm text-white/60">
                  Nos postes ouverts en ce moment. Choisissez l&apos;offre qui vous correspond et
                  démarrez votre candidature.
                </p>
              </Reveal>

              {offres === null ? (
                <p className="mt-8 font-sans text-sm text-white/50">Chargement des offres...</p>
              ) : offresTriees.length === 0 ? (
                <Reveal>
                  <div className="mt-8 rounded border border-white/10 bg-obsidianCard px-6 py-10 text-center">
                    <p className="font-display text-lg font-semibold text-white">
                      Aucune offre publiée pour le moment
                    </p>
                    <p className="mt-2 font-sans text-sm text-white/60">
                      De nouveaux postes ouvrent régulièrement. Envoyez dès maintenant une
                      candidature spontanée : nous vous recontacterons.
                    </p>
                  </div>
                </Reveal>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
                  {offresTriees.map((offre, i) => (
                    <Reveal key={offre.id} delay={i * 60}>
                      <div className="flex h-full flex-col">
                        <HangingPin />
                        <div className="mt-1 flex-1 rounded-lg border-2 border-accent/60 shadow-lg shadow-black/40 [&>article]:h-full">
                          <OffreCard
                            offre={offre}
                            selected={offreChoisie?.id === offre.id}
                            onPostuler={(o) => choisir({ offreId: o.id, listeAttente: false })}
                            onListeAttente={(o) => choisir({ offreId: o.id, listeAttente: true })}
                          />
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}

              {choix !== "spontanee" && offres !== null && (
                <p className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => choisir("spontanee")}
                    className="font-sans text-sm text-white/60 underline decoration-accent/40 underline-offset-4 hover:text-accent"
                  >
                    {offresTriees.length === 0
                      ? "Envoyer une candidature spontanée"
                      : "Aucune offre ne vous correspond ? Envoyer une candidature spontanée"}
                  </button>
                </p>
              )}

              {choix !== null && (
                <div ref={formRef} className="mx-auto mt-10 max-w-2xl scroll-mt-24">
                  <div className="mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
                    <p className="font-sans text-sm text-white/70">
                      {offreChoisie ? (
                        <>
                          {listeAttente ? "Inscription en liste d'attente pour : " : "Candidature pour : "}
                          <span className="font-semibold text-white">
                            {offreChoisie.drapeau ? `${offreChoisie.drapeau} ` : ""}
                            {offreChoisie.titre}
                          </span>
                        </>
                      ) : (
                        "Candidature spontanée"
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setChoix(null);
                        requestAnimationFrame(() => scrollTo(murRef));
                      }}
                      className="font-sans text-xs text-white/50 underline decoration-white/30 underline-offset-4 hover:text-accent"
                    >
                      Changer
                    </button>
                  </div>

                  {choix === "spontanee" && (
                    <label className="mb-6 block">
                      <span className="font-sans text-sm text-white">Métier visé</span>
                      <select
                        value={metierSpontane}
                        onChange={(e) => setMetierSpontane(e.target.value)}
                        className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2.5 font-sans text-sm text-white outline-none focus:border-accent"
                      >
                        <option value="">Choisissez un métier...</option>
                        <optgroup label="Missions à long terme">
                          {LONG_TERM_METIERS.map((m) => (
                            <option key={m.slug} value={m.slug}>
                              {m.title}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Missions à court terme">
                          {SHORT_TERM_METIERS.map((m) => (
                            <option key={m.slug} value={m.slug}>
                              {m.title}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </label>
                  )}

                  {segment && (
                    <RegistrationForm
                      key={offreChoisie ? `${offreChoisie.id}-${listeAttente}` : `spontanee-${segment}`}
                      segment={segment}
                      tone="dark"
                      ctaLabel={listeAttente ? "Rejoindre la liste d'attente" : "Envoyer ma candidature"}
                      offreEmploiId={offreChoisie?.id}
                      listeAttente={listeAttente}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="lg:border-l lg:border-accent/15 lg:pl-10">
              <TemoignagesEmbauche />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
