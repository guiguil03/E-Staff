import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import LoginForm from "@/components/comptes/LoginForm";

export const metadata: Metadata = {
  title: "Connexion — e-Staf",
  description:
    "Connexion réservée aux membres ayant reçu un numéro matricule de la part de l'équipe RH e-Staf, après validation de leur inscription.",
};

export default function ConnexionPage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-md">
        <Reveal>
          <h1 className="text-center font-display text-3xl font-bold text-primary sm:text-4xl">
            Connexion
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-center font-sans text-sm leading-relaxed text-muted sm:text-base">
            La connexion est réservée aux membres ayant reçu un numéro
            matricule de la part de notre équipe RH, après validation de
            leur inscription.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-10">
            <LoginForm />
          </div>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-6 text-center font-sans text-sm text-muted">
            Pas encore de matricule ?{" "}
            <Link
              href="/creer-un-compte"
              className="font-medium text-primary hover:text-accent"
            >
              Découvrir comment en obtenir un →
            </Link>
          </p>
        </Reveal>
      </div>
    </div>
  );
}
