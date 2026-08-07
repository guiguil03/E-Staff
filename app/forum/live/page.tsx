import type { Metadata } from "next";
import ForumLivePage from "@/components/forum/ForumLivePage";

export const metadata: Metadata = {
  title: "Live du mois — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ForumLivePage />;
}
