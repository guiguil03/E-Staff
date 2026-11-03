import type { Metadata } from "next";
import EntrepriseShell from "@/components/compte-entreprise/EntrepriseShell";
import LiveEtForum from "@/components/compte-entreprise/LiveEtForum";

export const metadata: Metadata = {
  title: "Live & forum — Espace Entreprise — e-Staf",
  robots: { index: false, follow: false },
};

export default function LiveForumPage() {
  return (
    <EntrepriseShell title="Live & forum" subtitle="Animez votre live dans la communauté et votre stand au forum virtuel.">
      <LiveEtForum />
    </EntrepriseShell>
  );
}
