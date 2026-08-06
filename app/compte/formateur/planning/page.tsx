import type { Metadata } from "next";
import { Suspense } from "react";
import PlanningDashboard from "@/components/compte-formateur/PlanningDashboard";

export const metadata: Metadata = {
  title: "Planning par Groupe — e-Staf",
  robots: { index: false, follow: false },
};

export default function PlanningPage() {
  return (
    <Suspense fallback={null}>
      <PlanningDashboard />
    </Suspense>
  );
}
