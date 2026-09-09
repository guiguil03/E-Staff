import type { Metadata } from "next";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Conditions générales — e-Staf",
};

export default function ConditionsGeneralesPage() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Avant de vous inscrire
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            Conditions générales d&apos;utilisation et d&apos;inscription
          </h1>
        </Reveal>

        <Reveal delay={60}>
          <div className="mt-10 space-y-10 font-sans text-sm leading-relaxed text-white/70">
            <section>
              <h2 className="font-display text-lg font-semibold text-white">
                Article 1 — Paiement &amp; conversion
              </h2>
              <p className="mt-3">
                Le paiement intégral des frais de formation est exigé avant le premier cours.
                Aucun remboursement ne sera effectué après validation de l&apos;inscription. Les
                tarifs sont fixés en euros et/ou convertibles en ariary (MGA) selon le cours de
                change, affiché au moment du paiement.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white">
                Article 2 — Assiduité &amp; renvoi
              </h2>
              <p className="mt-3">
                La présence aux cours est obligatoire. À la troisième absence, l&apos;apprenant
                est automatiquement exclu du groupe, afin de ne pas nuire à la progression
                collective. Cette exclusion n&apos;ouvre droit à aucun remboursement.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white">
                Article 3 — Accès au compte
              </h2>
              <p className="mt-3">
                Le compte de l&apos;apprenant est désactivé dès la fin du niveau validé, sauf en
                cas de réinscription ou de renouvellement.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white">
                Article 4 — Propriété intellectuelle
              </h2>
              <p className="mt-3">
                La caméra doit rester allumée pendant les cours. Il est strictement interdit
                d&apos;enregistrer les sessions ou de diffuser les supports pédagogiques e-Staf,
                sous quelque forme que ce soit.
              </p>
            </section>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
