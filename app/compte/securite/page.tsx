import type { Metadata } from "next";
import SecuriteCompte from "@/components/comptes/SecuriteCompte";

export const metadata: Metadata = {
  title: "Sécurité du compte — e-Staf",
  robots: { index: false, follow: false },
};

export default function SecuritePage() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Mon compte</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">Sécurité du compte</h1>
        <div className="mt-8">
          <SecuriteCompte />
        </div>
      </div>
    </div>
  );
}
