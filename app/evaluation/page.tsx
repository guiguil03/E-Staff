import type { Metadata } from "next";
import EvaluationFlow from "@/components/evaluation/EvaluationFlow";

export const metadata: Metadata = {
  title: "Évaluation candidat — e-Staf",
  description: "Passez le test d'évaluation e-Staf : lexique, compréhension orale et mises en situation professionnelles.",
};

export default function EvaluationPage() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6">
      <div className="mx-auto mb-10 max-w-lg text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Évaluation
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
          Test d&apos;évaluation e-Staf
        </h1>
      </div>
      <EvaluationFlow />
    </div>
  );
}
