import Reveal from "@/components/Reveal";
import RegistrationForm from "@/components/RegistrationForm";

// Final B2B contact CTA — deliberately placed at the very end of the page,
// per the client's instruction: this is where a visitor lands after reading
// the full pitch, not a generic homepage button.
export default function ContactSection() {
  return (
    <section className="border-t border-accent/30 bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Passons à l&apos;action
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
            Nous contacter pour un service d&apos;externalisation
          </h2>
          <p className="mt-4 font-sans text-base text-white/70">
            Un lot à réserver, une mission ponctuelle ou simplement une
            question&nbsp;: laissez-nous vos coordonnées, un membre de
            l&apos;équipe e-Staf revient vers vous rapidement.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <RegistrationForm
            segment="contact-b2b"
            ctaLabel="Envoyer ma demande"
            tone="dark"
            className="mt-10 text-left"
          />
        </Reveal>
      </div>
    </section>
  );
}
