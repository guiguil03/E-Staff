import Image from "next/image";
import Reveal from "@/components/Reveal";

export default function Hero() {
  return (
    <section className="bg-background px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <Image
            src="/brand/logo.png"
            alt="e-Staf"
            width={112}
            height={112}
            className="mx-auto h-16 w-16 rounded-full object-cover shadow-md ring-1 ring-primary/10 sm:h-20 sm:w-20 md:h-24 md:w-24"
            priority
          />
        </Reveal>

        <Reveal delay={80}>
          <p className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">
            e-Staf — Académie de langues &amp; externalisation d&apos;élite — Madagascar
          </p>
        </Reveal>

        <Reveal delay={160}>
          <h1 className="mt-6 font-display text-3xl font-semibold leading-tight text-primary sm:text-4xl md:text-5xl">
            Le talent a une voix. L&apos;entreprise a des exigences.
            <br className="hidden sm:block" /> e-Staf aligne les deux.
          </h1>
        </Reveal>

        <Reveal delay={240}>
          <p className="mx-auto mt-6 max-w-2xl font-sans text-base text-muted sm:text-lg">
            Une académie d&apos;excellence linguistique et un partenaire d&apos;externalisation
            exigeant — au service d&apos;une même conviction : le potentiel humain, révélé et
            certifié, est la meilleure garantie de performance.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
