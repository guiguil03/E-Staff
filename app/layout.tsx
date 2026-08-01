import type { Metadata } from "next";
import { fraunces, plexSans, plexMono } from "@/lib/fonts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "e-Staf — Académie de langues & externalisation d'élite, Madagascar",
  description:
    "e-Staf accompagne talents et entreprises à Madagascar : préparation aux examens internationaux, programme d'excellence oratoire (FOL), et externalisation d'élite avec des profils formés et managés avec rigueur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
