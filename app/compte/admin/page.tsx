import type { Metadata } from "next";
import AdminDashboard from "@/components/compte-admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Espace Admin — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminDashboard />;
}
