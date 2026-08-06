import type { Metadata } from "next";
import ClasseVirtuelleApprenantPage from "@/components/compte-apprenant/ClasseVirtuelleApprenantPage";

export const metadata: Metadata = {
  title: "Classe virtuelle — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ClasseVirtuelleApprenantPage />;
}
