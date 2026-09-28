import type { Metadata } from "next";
import NoterApprenantDashboard from "@/components/compte-formateur/NoterApprenantDashboard";

export const metadata: Metadata = {
  title: "Noter la séance — e-Staf",
  robots: { index: false, follow: false },
};

export default async function NoterApprenantPage({
  params,
  searchParams,
}: {
  params: Promise<{ apprenantId: string }>;
  searchParams: Promise<{ seance?: string; groupe?: string }>;
}) {
  const [{ apprenantId }, query] = await Promise.all([params, searchParams]);
  const seance = Number(query.seance ?? "1");
  const groupe = query.groupe ?? "";
  return (
    <NoterApprenantDashboard apprenantId={apprenantId} seance={seance} groupe={groupe} />
  );
}
