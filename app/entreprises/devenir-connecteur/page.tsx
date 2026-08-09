import type { Metadata } from "next";
import Link from "next/link";
import ConnecteurFlow from "@/components/entreprises/contact/ConnecteurFlow";

export const metadata: Metadata = {
  title: "Devenir Connecteur e-Staf",
  description:
    "Rejoignez le réseau Connecteur e-Staf : générez des revenus récurrents en mettant en relation vos partenaires avec nos unités d'élite.",
};

export default function DevenirConnecteurPage() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/entreprises"
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour
        </Link>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-accent">
          Contact & Partenariats
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
          Devenir Connecteur e-Staf
        </h1>

        <div className="mt-10 text-left">
          <ConnecteurFlow />
        </div>
      </div>
    </div>
  );
}
