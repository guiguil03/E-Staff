"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireRole } from "@/lib/useRequireRole";
import ViewAsBanner from "@/components/ViewAsBanner";

// Coquille commune de l'Espace Entreprise — même rôle que SuperviseurShell :
// garde d'accès (session de rôle "entreprise", voir EntrepriseGuard côté
// backend), bandeau « se connecter en tant que », en-tête et navigation.
const NAV_ITEMS = [
  { href: "/compte/entreprise", label: "Tableau de bord", icon: "▲" },
  { href: "/compte/entreprise/vivier", label: "Vivier de talents", icon: "☆" },
  { href: "/compte/entreprise/entretiens", label: "Entretiens", icon: "🎥" },
  { href: "/compte/entreprise/formation", label: "Formation", icon: "📚" },
  { href: "/compte/entreprise/echange", label: "Échange superviseur", icon: "✉" },
  { href: "/compte/entreprise/live-forum", label: "Live & forum", icon: "📡" },
  { href: "/compte/entreprise/mon-casier", label: "Mon casier", icon: "▣" },
  { href: "/compte/securite", label: "Sécurité", icon: "⚙" },
] as const;

interface EntrepriseShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function EntrepriseShell({ title, subtitle, children }: EntrepriseShellProps) {
  const checked = useRequireRole("entreprise");
  const pathname = usePathname();

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian">
      <div className="border-b border-white/10 bg-obsidianCard/60 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold text-white">
            e-<span className="text-accent">Staf</span>
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">Espace Entreprise</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ViewAsBanner />

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/compte/entreprise" ? pathname === item.href : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded border px-3 py-2.5 font-sans text-sm transition-colors ${
                  active
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-transparent text-white/60 hover:border-white/15 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base leading-none" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <h1 className="mt-6 font-display text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 font-sans text-sm text-white/60">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
