import type { Metadata } from "next";
import HistoriqueDashboard from "@/components/compte-formateur/HistoriqueDashboard";

export const metadata: Metadata = {
  title: "Historique des séances — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HistoriqueDashboard />;
}
