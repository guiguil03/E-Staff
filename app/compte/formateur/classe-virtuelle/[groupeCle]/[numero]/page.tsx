import type { Metadata } from "next";
import ClasseVirtuelleFormateurPage from "@/components/compte-formateur/ClasseVirtuelleFormateurPage";

export const metadata: Metadata = {
  title: "Classe virtuelle — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page({
  params,
}: {
  params: { groupeCle: string; numero: string };
}) {
  return (
    <ClasseVirtuelleFormateurPage groupeCle={params.groupeCle} numero={Number(params.numero)} />
  );
}
