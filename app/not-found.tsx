import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center bg-obsidian px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-lg text-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Erreur 404</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            Page introuvable
          </h1>
          <p className="mt-4 font-sans text-sm leading-relaxed text-white/60">
            Cette page n&apos;existe pas ou a été déplacée. Vérifiez l&apos;adresse, ou repartez de
            l&apos;accueil.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/" variant="dark">
              Retour à l&apos;accueil
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
