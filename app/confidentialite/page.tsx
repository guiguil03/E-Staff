import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import PlaceholderNotice from "@/components/legal/PlaceholderNotice";

export const metadata: Metadata = {
  title: "Confidentialité — e-Staf",
};

const fieldClass = "text-accent";

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Vos données
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            Politique de confidentialité
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
              <h2 className="font-display text-lg font-semibold text-white">
                1. Responsable du traitement
              </h2>
              <p className="mt-3">
                Le responsable du traitement des données collectées sur ce site est{" "}
                <span className={fieldClass}>à compléter</span>. Pour exercer vos droits ou
                poser une question, contactez : <span className={fieldClass}>à compléter</span>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white">
                2. Données collectées
              </h2>
              <p className="mt-3">
                Selon les formulaires que vous utilisez, e-Staf peut collecter : votre prénom,
                nom, e-mail et téléphone (inscription à un examen, à la FOL, candidature métier,
                demande de compte) ; des informations sur votre entreprise (raison sociale,
                secteur, effectif, besoins) si vous soumettez un formulaire B2B ; ainsi que vos
                réponses écrites et vos enregistrements audio/vidéo si vous passez le test
                d&apos;évaluation candidat.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white">3. Finalités</h2>
              <p className="mt-3">
                Ces données sont utilisées pour traiter votre inscription ou candidature, vous
                recontacter, évaluer votre dossier lorsqu&apos;un test est requis, et gérer la
                relation commerciale pour les demandes d&apos;entreprises. Elles ne sont pas
                utilisées à des fins de prospection non liées à votre demande initiale.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white">
                4. Durée de conservation
              </h2>
              <p className="mt-3">
                Durée de conservation par type de donnée : <span className={fieldClass}>à compléter</span>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white">
                5. Destinataires des données
              </h2>
              <p className="mt-3">
                Vos données sont traitées par les équipes e-Staf. Liste des sous-traitants
                techniques (hébergement, stockage, envoi d&apos;e-mails) : <span className={fieldClass}>à compléter</span>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white">6. Vos droits</h2>
              <p className="mt-3">
                Conformément à la réglementation applicable, vous disposez d&apos;un droit
                d&apos;accès, de rectification, d&apos;effacement et d&apos;opposition sur vos
                données personnelles. Pour l&apos;exercer, contactez{" "}
                <span className={fieldClass}>à compléter</span>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-white">7. Cookies &amp; mesure d&apos;audience</h2>
              <p className="mt-3">
                Ce site utilise Vercel Web Analytics à des fins de mesure d&apos;audience
                agrégée et anonymisée (pas de cookie de suivi individuel).
              </p>
            </section>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
