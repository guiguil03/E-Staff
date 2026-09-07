import type { Metadata } from "next";
import ContratInscrit from "@/components/registrations/ContratInscrit";

export const metadata: Metadata = {
  title: "Votre contrat de formation | e-Staf",
  robots: { index: false, follow: false },
};

export default function ContratInscriptionPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Votre inscription
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
          Votre contrat de formation
        </h1>

        <div className="mt-8">
          <ContratInscrit registrationId={params.id} />
        </div>
      </div>
    </div>
  );
}
