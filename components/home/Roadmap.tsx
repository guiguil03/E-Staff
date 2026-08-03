import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";
import {
  BrainGearIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
} from "@/components/icons/HomeIcons";

interface RoadmapCardProps {
  number: string;
  title: string;
  gradient: string;
  icon: ReactNode;
  children: ReactNode;
}

function RoadmapCard({ number, title, gradient, icon, children }: RoadmapCardProps) {
  return (
    <div className={`flex flex-1 flex-col rounded p-6 text-white shadow-lg shadow-black/40 sm:p-7 ${gradient}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold uppercase leading-snug sm:text-xl">
          <span>{number}. </span>
          {title}
        </h3>
        <div className="mt-1 h-8 w-8 shrink-0 text-white/90 sm:h-9 sm:w-9">{icon}</div>
      </div>
      <div className="mt-5 space-y-3 font-sans text-sm leading-relaxed text-white/95">
        {children}
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div
      aria-hidden="true"
      className="hidden shrink-0 items-center justify-center px-2 font-display text-2xl font-bold text-accent/40 md:flex"
    >
      ›
    </div>
  );
}

export default function Roadmap() {
  return (
    <section className="bg-obsidian px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Notre Parcours d&apos;Équivalences &amp; d&apos;Intégration
            </h2>
            <p className="mt-3 font-sans text-base text-white/70 sm:text-lg">
              Un filtre exigeant pour les entreprises, un tremplin garanti pour les candidats.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 flex flex-col gap-6 md:flex-row md:items-stretch md:gap-0">
            <RoadmapCard
              number="01"
              title="Évaluation initiale & diagnostic"
              gradient="bg-gradient-to-br from-primary to-teal"
              icon={<ClipboardCheckIcon className="h-full w-full" />}
            >
              <p className="font-semibold">
                Niveau d&apos;entrée : B1 à B2 (Bases solides mais non prêt pour la prod)
              </p>
              <ul className="list-disc space-y-2 pl-5 marker:text-white/60">
                <li>
                  <strong className="font-semibold">Action :</strong> Test linguistique et
                  comportemental ciblé par métier.
                </li>
                <li>
                  <strong className="font-semibold">Résultat :</strong> Identification précise
                  des lacunes (élocution, fluidité, gestion du stress, posture professionnelle).
                </li>
              </ul>
            </RoadmapCard>

            <Connector />

            <RoadmapCard
              number="02"
              title="Montée en compétence & bootcamp de posture"
              gradient="bg-gradient-to-br from-teal to-success"
              icon={<BrainGearIcon className="h-full w-full" />}
            >
              <p>
                <strong className="font-semibold">Action :</strong> Orientation vers le Programme
                FOL ou nos modules intensifs d&apos;académie.
              </p>
              <div>
                <p className="font-semibold">Focus :</p>
                <ul className="mt-2 list-[circle] space-y-2 pl-5 marker:text-white/60">
                  <li>
                    <strong className="font-semibold">Excellence linguistique :</strong> Maîtrise
                    des nuances, correction phonétique et syntaxique.
                  </li>
                  <li>
                    <strong className="font-semibold">
                      Posture professionnelle &amp; soft skills :
                    </strong>{" "}
                    Assurance à l&apos;oral, gestion des objections client, rigueur B2B et culture
                    d&apos;entreprise.
                  </li>
                </ul>
              </div>
            </RoadmapCard>

            <Connector />

            <RoadmapCard
              number="03"
              title="Certification C1/C2 & placement en production"
              gradient="bg-gradient-to-br from-accent to-accent/60"
              icon={<GraduationCapIcon className="h-full w-full" />}
            >
              <p className="font-semibold">
                Niveau visé : C1 à C2 certifié (validation par examens officiels)
              </p>
              <ul className="list-disc space-y-2 pl-5 marker:text-white/60">
                <li>
                  <strong className="font-semibold">Déploiement :</strong> Intégration immédiate
                  dans des lots d&apos;agents dédiés.
                </li>
                <li>
                  <strong className="font-semibold">Garantie B2B :</strong> Talents immédiatement
                  opérationnels, zéro temps de rodage perdu pour le client.
                </li>
              </ul>
            </RoadmapCard>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
