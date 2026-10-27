"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireRole } from "@/lib/useRequireRole";
import ViewAsBanner from "@/components/ViewAsBanner";

// Coquille commune de l'Espace Superviseur — même rôle que RhShell pour le
// Portail RH : garde d'accès (session de rôle "agent", voir AgentGuard côté
// backend), bandeau « se connecter en tant que », en-tête et navigation.
// L'agent n'a que trois écrans (ses performances, son dossier, sa paie) plus
// la page Sécurité commune à tous les rôles.
const NAV_ITEMS = [
  { href: "/compte/superviseur", label: "Tableau de bord", icon: "▲" },
  { href: "/compte/superviseur/mon-casier", label: "Mon casier", icon: "▣" },
  { href: "/compte/securite", label: "Sécurité", icon: "⚙" },
] as const;

interface SuperviseurShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function SuperviseurShell({ title, subtitle, children }: SuperviseurShellProps) {
  const checked = useRequireRole("superviseur");
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
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">
            Espace Superviseur
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ViewAsBanner />

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/compte/superviseur" ? pathname === item.href : pathname?.startsWith(item.href);
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
