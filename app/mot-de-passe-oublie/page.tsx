import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ForgotPasswordForm from "@/components/comptes/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — e-Staf",
};

export default function MotDePasseOubliePage() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-md">
        <Reveal>
          <h1 className="text-center font-display text-3xl font-bold text-accent sm:text-4xl">
            Mot de passe oublié
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-center font-sans text-sm leading-relaxed text-white/70 sm:text-base">
            Indiquez votre matricule, nous vous envoyons un lien pour choisir un nouveau mot de
            passe.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-10">
            <ForgotPasswordForm />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
