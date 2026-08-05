import type { Metadata } from "next";
import CorrigerDashboard from "@/components/compte-formateur/CorrigerDashboard";

export const metadata: Metadata = {
  title: "Évaluer & Corriger — e-Staf",
  robots: { index: false, follow: false },
};

export default function CorrigerPage() {
  return <CorrigerDashboard />;
}
