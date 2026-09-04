import type { Metadata } from "next";
import ForumLivePage from "@/components/forum/ForumLivePage";
import ForumAccessGate from "@/components/forum/ForumAccessGate";

export const metadata: Metadata = {
  title: "Live du mois — e-Staf",
  robots: { index: false, follow: false },
};

// Masqué au public depuis le 2026-09-05, voir ForumAccessGate.
export default function Page() {
  return (
    <ForumAccessGate>
      <ForumLivePage />
    </ForumAccessGate>
  );
}
