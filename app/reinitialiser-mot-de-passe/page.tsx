import { Suspense } from "react";
import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ResetPasswordForm from "@/components/comptes/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Nouveau mot de passe — e-Staf",
};

export default function ReinitialiserMotDePassePage() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-md">
        <Reveal>
          <h1 className="text-center font-display text-3xl font-bold text-accent sm:text-4xl">
            Nouveau mot de passe
          </h1>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-10">
            <Suspense fallback={null}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
