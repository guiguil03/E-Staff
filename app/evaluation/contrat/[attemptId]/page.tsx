import type { Metadata } from "next";
import ContratCandidat from "@/components/evaluation/ContratCandidat";

export const metadata: Metadata = {
  title: "Votre contrat de formation | e-Staf",
};

export default function ContratPage({ params }: { params: { attemptId: string } }) {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Résultat &amp; contrat
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
          Votre contrat de formation
        </h1>

        <div className="mt-8">
          <ContratCandidat attemptId={params.attemptId} />
        </div>
      </div>
    </div>
  );
}
