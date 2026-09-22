"use client";

import { useEffect } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log console client — pas d'outil de suivi d'erreurs (Sentry) branché
    // à ce jour, voir audit du 2026-09-21. Le `digest` identifie l'erreur
    // côté logs serveur Next.js si besoin de la retrouver.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center bg-obsidian px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-lg text-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Erreur</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            Une erreur est survenue
          </h1>
          <p className="mt-4 font-sans text-sm leading-relaxed text-white/60">
            Quelque chose s&apos;est mal passé de notre côté. Réessayez, ou revenez à l&apos;accueil
            si le problème persiste.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={reset} variant="ghostDark">
              Réessayer
            </Button>
            <Button href="/" variant="dark">
              Retour à l&apos;accueil
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
