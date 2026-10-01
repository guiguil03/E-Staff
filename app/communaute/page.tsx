import { redirect } from "next/navigation";

// Communauté mise en pause le 2026-09-26 (demande cliente) et remplacée par
// « Ma carrière » — voir components/communaute/CommunautePage.tsx pour la
// rétablir.
export default function CommunautePage() {
  redirect("/offres/carrieres");
}
