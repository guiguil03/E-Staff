import type { Metadata } from "next";
import Link from "next/link";
import ProjetExternalisationFlow from "@/components/entreprises/contact/ProjetExternalisationFlow";

export const metadata: Metadata = {
  title: "Proposer un projet d'externalisation — e-Staf",
  description:
    "Décrivez votre projet d'externalisation à l'équipe e-Staf et réservez votre créneau de cadrage commercial.",
};

export default function ProposerUnProjetPage() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/entreprises"
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour
        </Link>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-accent">
          Contact & Partenariats
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
          Proposer un projet d&apos;externalisation
        </h1>
        <p className="mt-4 font-sans text-base text-white/70">
          Un lot à réserver, une mission ponctuelle ou simplement une
          question&nbsp;: laissez-nous vos coordonnées, un membre de
          l&apos;équipe e-Staf revient vers vous rapidement.
        </p>

        <div className="mt-10 text-left">
          <ProjetExternalisationFlow />
        </div>
      </div>
    </div>
  );
}
