import Link from "next/link";
import Button from "@/components/ui/Button";
import Reveal from "@/components/Reveal";

export default function Hero() {
  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            e-Staf — Académie de langues &amp; externalisation d&apos;élite — Madagascar
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mt-5 font-display text-3xl font-semibold leading-tight text-primary sm:text-4xl md:text-5xl">
            Le talent a une voix. L&apos;entreprise a des exigences.
            <br className="hidden sm:block" /> e-Staf aligne les deux.
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto mt-5 max-w-2xl font-sans text-base text-muted sm:text-lg">
            Une académie d&apos;excellence linguistique et un partenaire d&apos;externalisation
            exigeant — au service d&apos;une même conviction : le potentiel humain, révélé et
            certifié, est la meilleure garantie de performance.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/offres/carrieres" variant="accent">
              Créer un compte
            </Button>
            <Link
              href="/entreprises"
              className="font-sans text-sm font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
            >
              Nous contacter pour un projet d&apos;externalisation
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
