"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireRole } from "@/lib/useRequireRole";

const NAV_ITEMS = [
  { href: "/compte/admin", label: "Vue d'ensemble", icon: "◈" },
  { href: "/compte/admin/cycle", label: "Cycle complet", icon: "⟲" },
  { href: "/compte/admin/coordonnees", label: "Coordonnées", icon: "☎" },
  { href: "/compte/admin/recrutement", label: "Recrutement", icon: "✦" },
  { href: "/compte/admin/academie", label: "Académie & Vagues", icon: "❖" },
  { href: "/compte/admin/production", label: "Production", icon: "▲" },
  { href: "/compte/admin/partenaires", label: "Partenaires", icon: "◎" },
  { href: "/compte/admin/reunions", label: "Réunions", icon: "☰" },
  { href: "/compte/admin/facturation", label: "Facturation & Encaissement", icon: "⊕" },
  { href: "/compte/admin/paie-commissions", label: "Paie & Commissions", icon: "◆" },
  { href: "/compte/admin/parametres", label: "Paramètres RH", icon: "⚙" },
] as const;

interface RhShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

// Coquille commune du Portail RH — sidebar de navigation + header, réutilisée
// par toutes les pages /compte/admin/*. Reprend le "compte Admin" existant
// (même login/guard, voir AdminGuard côté back) plutôt que d'introduire un
// vrai rôle "rh" distinct — l'un des 8 rôles du cahier des charges
// (components/comptes/roles.ts) mais pas encore implémenté en auth réelle ;
// le portail RH se construit ici sur le compte Admin qui gère déjà la
// validation RH/paiements (voir ValidationRhPanel), cohérent avec l'existant.
export default function RhShell({ title, subtitle, children }: RhShellProps) {
  const checked = useRequireRole("admin");
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
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold text-white">
            e-<span className="text-accent">Staf</span>
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">
            Portail RH, Académie &amp; Pilotage
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:gap-8">
        <aside className="shrink-0 lg:w-64">
          <nav className="flex gap-2 overflow-x-auto lg:sticky lg:top-8 lg:flex-col lg:gap-1 lg:overflow-visible">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/compte/admin"
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded border px-3 py-2.5 font-sans text-sm transition-colors lg:w-full ${
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
        </aside>

        <main className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 font-sans text-sm text-white/60">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
