import type { Metadata } from "next";
import CalendrierDashboard from "@/components/compte-formateur/CalendrierDashboard";

export const metadata: Metadata = {
  title: "Calendrier — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CalendrierDashboard />;
}
