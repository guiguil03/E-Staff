"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireRole } from "@/lib/useRequireRole";
import { ACCOUNT_ROLE_KEY } from "@/lib/accountSession";

// `roles` : qui voit ce lien dans la sidebar — doit rester cohérent avec le
// guard backend réel de la page visée (voir rh.controller.ts et les autres
// contrôleurs pour le détail de la scission Admin/RH du 2026-09-18).
const NAV_ITEMS = [
  { href: "/compte/admin", label: "Vue d'ensemble", icon: "◈", roles: ["rh"] },
  { href: "/compte/admin/cycle", label: "Cycle complet", icon: "⟲", roles: ["rh"] },
  { href: "/compte/admin/coordonnees", label: "Coordonnées", icon: "☎", roles: ["rh"] },
  { href: "/compte/admin/recrutement", label: "Recrutement", icon: "✦", roles: ["rh"] },
  { href: "/compte/admin/inscriptions", label: "Inscriptions", icon: "✎", roles: ["rh"] },
  { href: "/compte/admin/academie", label: "Académie & Vagues", icon: "❖", roles: ["admin"] },
  { href: "/compte/admin/production", label: "Production", icon: "▲", roles: ["rh"] },
  { href: "/compte/admin/partenaires", label: "Partenaires", icon: "◎", roles: ["rh"] },
  { href: "/compte/admin/agents-acquisition", label: "Agents d'Acquisition", icon: "✚", roles: ["rh"] },
  { href: "/compte/admin/reunions", label: "Réunions", icon: "☰", roles: ["admin"] },
  { href: "/compte/admin/facturation", label: "Facturation & Encaissement", icon: "⊕", roles: ["rh"] },
  { href: "/compte/admin/paie-commissions", label: "Paie & Commissions", icon: "◆", roles: ["rh"] },
  { href: "/compte/admin/parametres", label: "Paramètres RH", icon: "⚙", roles: ["admin"] },
] as const;

interface RhShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Rôle(s) autorisés sur cette page précise — doit correspondre au(x)
   * guard(s) backend réels des appels API qu'elle fait. Par défaut les deux
   * (pages neutres/partagées), à préciser explicitement pour toute page
   * scindée Admin/RH. */
  roles?: ("admin" | "rh")[];
}

// Coquille commune du Portail (Admin + RH) — sidebar de navigation + header,
// réutilisée par toutes les pages /compte/admin/*. Les deux comptes
// partagent ce même portail depuis la scission du 2026-09-18 (avant cette
// date, un unique compte "Admin" surchargé faisait tout) : chaque page passe
// son propre `roles` à cette coquille, et la sidebar ne montre à chacun que
// les liens qu'il peut réellement ouvrir.
export default function RhShell({ title, subtitle, children, roles = ["admin", "rh"] }: RhShellProps) {
  const checked = useRequireRole(roles);
  const pathname = usePathname();
  const currentRole =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_ROLE_KEY) : null;
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !currentRole || (item.roles as readonly string[]).includes(currentRole)
  );

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
            {visibleNavItems.map((item) => {
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
