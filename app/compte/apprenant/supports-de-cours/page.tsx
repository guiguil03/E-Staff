import type { Metadata } from "next";
import SupportsCoursPage from "@/components/compte-apprenant/SupportsCoursPage";

export const metadata: Metadata = {
  title: "Supports de cours — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SupportsCoursPage />;
}
