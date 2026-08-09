"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { SECTEURS_FORMATION } from "./secteurs";

// 3 secteurs cliquables — au clic, le détail (pitch, modules, volume
// horaire, CTA de prise de RDV) s'affiche juste en dessous, dans le même
// panneau. Choix d'un reveal inline (pas de page dédiée par secteur) car
// c'est de la lecture, pas un formulaire long — seule la prise de RDV en
// bout de chaîne obtient sa propre page, conformément à la convention du
// projet.
export default function SecteurSelector() {
  const [selected, setSelected] = useState(SECTEURS_FORMATION[0].slug);
  const secteur = SECTEURS_FORMATION.find((s) => s.slug === selected) ?? SECTEURS_FORMATION[0];

  return (
    <section className="bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Solutions directes sur vos sites
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Choisissez votre secteur
            </h2>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SECTEURS_FORMATION.map((s) => (
              <button
                key={s.slug}
                onClick={() => setSelected(s.slug)}
                className={`flex flex-col items-center gap-2 rounded border p-6 text-center transition-colors ${
                  selected === s.slug
                    ? "border-accent bg-obsidianCard"
                    : "border-white/10 bg-obsidianCard hover:border-accent/50"
                }`}
              >
                <span className="text-3xl leading-none">{s.emoji}</span>
                <span className="font-display text-sm font-bold text-white">{s.label}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  {selected === s.slug ? "Sélectionné" : "Cliquer pour voir"}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div key={secteur.slug} className="mt-8 rounded border border-accent/30 bg-obsidianCard p-6 sm:p-8">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white sm:text-xl">
              {secteur.emoji} {secteur.label}
            </h3>

            <div className="mt-4 space-y-3">
              {secteur.quote.map((line) => (
                <p key={line} className="font-sans text-sm italic leading-relaxed text-white/80">
                  &laquo;&nbsp;{line}&nbsp;&raquo;
                </p>
              ))}
            </div>

            <div className="mt-6">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Modules inclus
              </p>
              <ul className="mt-3 space-y-2">
                {secteur.modules.map((m) => (
                  <li key={m} className="flex gap-2 font-sans text-sm text-white/70">
                    <span className="text-accent">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-white/50">
              ⏱️ Volume Horaire : {secteur.volumeHoraire}
            </p>

            {secteur.slug === "francais-admin-b2b" && (
              <div className="mt-6 flex flex-col items-start gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-sans text-sm text-white/60">
                  🤝 Vous souhaitez approfondir spécifiquement la Négociation et l&apos;art
                  oratoire ?
                </p>
                <Button variant="ghostDark" href="/offres/fol">
                  Rejoindre notre offre FOL
                </Button>
              </div>
            )}

            <div className="mt-6 border-t border-white/10 pt-6">
              <Button
                variant="dark"
                href={`/entreprises/former-son-equipe/rendez-vous?secteur=${secteur.slug}`}
              >
                Prendre rendez-vous
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
