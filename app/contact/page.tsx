import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import PlaceholderNotice from "@/components/legal/PlaceholderNotice";

export const metadata: Metadata = {
  title: "Contact — e-Staf",
};

const fieldClass = "text-accent";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Nous contacter
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            Contact
          </h1>
          <p className="mt-4 font-sans text-sm leading-relaxed text-white/70 sm:text-base">
            Pour une demande liée à une candidature, un examen ou un partenariat, utilisez de
            préférence le formulaire de la page concernée — vous serez recontacté(e) plus vite.
            Pour toute autre question, voici nos coordonnées.
          </p>
        </Reveal>

        <Reveal delay={60}>
          <div className="mt-8">
            <PlaceholderNotice />
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 rounded border border-white/10 bg-obsidianCard p-6 sm:p-8">
            <dl className="space-y-5 font-sans text-sm">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                  Adresse
                </dt>
                <dd className={`mt-1 ${fieldClass}`}>à compléter</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                  Téléphone
                </dt>
                <dd className={`mt-1 ${fieldClass}`}>à compléter</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                  E-mail
                </dt>
                <dd className={`mt-1 ${fieldClass}`}>à compléter</dd>
              </div>
            </dl>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
