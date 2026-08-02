import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import AccountCreationForm from "@/components/comptes/AccountCreationForm";

export const metadata: Metadata = {
  title: "Créer un compte — e-Staf",
  description:
    "Demandez la création de votre compte e-Staf : choisissez votre profil, renseignez vos coordonnées et découvrez comment l'équipe RH attribue votre numéro matricule.",
};

export default function CreerUnComptePage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h1 className="text-center font-display text-3xl font-bold text-primary sm:text-4xl">
            Créer un compte
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center font-sans text-base leading-relaxed text-ink sm:text-lg">
            Un compte e-Staf n&apos;est pas créé instantanément. Il est
            réservé aux personnes sérieuses : chaque profil est validé par
            notre équipe, avant l&apos;attribution d&apos;un numéro
            matricule qui donne accès à l&apos;espace personnel.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-10">
            <AccountCreationForm />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
