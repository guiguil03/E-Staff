import type { Metadata } from "next";
import ClasseVirtuelleFormateurPage from "@/components/compte-formateur/ClasseVirtuelleFormateurPage";

export const metadata: Metadata = {
  title: "Classe virtuelle — e-Staf",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ groupeCle: string; numero: string }>;
}) {
  const { groupeCle, numero } = await params;
  return (
    <ClasseVirtuelleFormateurPage groupeCle={groupeCle} numero={Number(numero)} />
  );
}
