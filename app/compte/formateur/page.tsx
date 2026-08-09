import type { Metadata } from "next";
import FormateurDashboard from "@/components/compte-formateur/FormateurDashboard";

export const metadata: Metadata = {
  title: "Cockpit Formateur — e-Staf",
  robots: { index: false, follow: false },
};

export default function CompteFormateurPage() {
  return <FormateurDashboard />;
}
