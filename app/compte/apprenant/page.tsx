import type { Metadata } from "next";
import ApprenantDashboard from "@/components/compte-apprenant/ApprenantDashboard";

export const metadata: Metadata = {
  title: "Espace Apprenant — e-Staf",
  robots: { index: false, follow: false },
};

export default function CompteApprenantPage() {
  return <ApprenantDashboard />;
}
