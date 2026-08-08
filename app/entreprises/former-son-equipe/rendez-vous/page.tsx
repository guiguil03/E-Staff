import { Suspense } from "react";
import type { Metadata } from "next";
import RendezVousFlow from "@/components/entreprises/former-equipe/RendezVousFlow";

export const metadata: Metadata = {
  title: "Prendre rendez-vous | Former son équipe | e-Staf",
};

export default function RendezVousPage() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Former son équipe
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
          Prendre rendez-vous
        </h1>
        <p className="mt-3 font-sans text-sm text-white/60">
          Laissez-nous vos coordonnées, un membre de l&apos;équipe e-Staf revient vers vous
          rapidement pour la suite.
        </p>

        <div className="mt-8">
          <Suspense fallback={null}>
            <RendezVousFlow />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
