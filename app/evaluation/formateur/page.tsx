import type { Metadata } from "next";
import TrainerDashboard from "@/components/evaluation/TrainerDashboard";

export const metadata: Metadata = {
  title: "Correction formateur — e-Staf",
  robots: { index: false, follow: false },
};

export default function TrainerPage() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-16 sm:px-6">
      <div className="mx-auto mb-10 max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Interface formateur
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
          Correction des mises en situation
        </h1>
      </div>
      <div className="mx-auto max-w-4xl">
        <TrainerDashboard />
      </div>
    </div>
  );
}
