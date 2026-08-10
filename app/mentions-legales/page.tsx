import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import PlaceholderNotice from "@/components/legal/PlaceholderNotice";

export const metadata: Metadata = {
  title: "Mentions légales — e-Staf",
};

const fieldClass = "text-accent";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Informations légales
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            Mentions légales
          </h1>
        </Reveal>

        <Reveal delay={60}>
          <div className="mt-8">
            <PlaceholderNotice />
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 space-y-10 font-sans text-sm leading-relaxed text-white/70">
            <section>
              <h2 className="font-display text-lg font-semibold text-white">1. Éditeur du site</h2>
              <p className="mt-3">
                Raison sociale : <span className={fieldClass}>à compléter</span>
                <br />
                Forme juridique : <span className={fieldClass}>à compléter</span>
                <br />
                Siège social : <span className={fieldClass}>à compléter</span>
                <br />
                Numéro d&apos;immatriculation : <span className={fieldClass}>à compléter</span>
                <br />
                Représentant légal : <span className={fieldClass}>à compléter</span>
                <br />
                Contact : <span className={fieldClass}>à compléter</span>
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white">2. Hébergement</h2>
              <p className="mt-3">
                Hébergeur (site) : <span className={fieldClass}>à compléter</span>
                <br />
                Hébergeur (application &amp; données) : <span className={fieldClass}>à compléter</span>
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white">
                3. Propriété intellectuelle
              </h2>
              <p className="mt-3">
                L&apos;ensemble des contenus présents sur ce site (textes, images, logos,
                identité visuelle) est protégé par le droit de la propriété intellectuelle.
                Toute reproduction, représentation ou exploitation, totale ou partielle, sans
                autorisation préalable est interdite.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white">4. Responsabilité</h2>
              <p className="mt-3">
                e-Staf s&apos;efforce d&apos;assurer l&apos;exactitude des informations
                diffusées sur ce site, sans pouvoir garantir qu&apos;elles soient exemptes
                d&apos;erreur ou d&apos;omission. L&apos;utilisateur reconnaît utiliser ces
                informations sous sa responsabilité exclusive.
              </p>
            </section>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
