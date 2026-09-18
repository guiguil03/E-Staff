"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ACCOUNT_ROLE_KEY, ACCOUNT_MATRICULE_KEY, ROLE_ROUTES } from "@/lib/accountSession";

// Remplace "Se connecter" par le matricule (lien vers le tableau de bord) +
// "Se déconnecter" une fois connecté. Rendu initial = déconnecté (state SSR-
// safe, sessionStorage n'existe pas côté serveur) puis mis à jour après
// montage, même principe que useRequireRole.
//
// Ce composant vit dans le layout persistant (header) : il ne se remonte
// jamais lors d'une navigation client-side, donc son useEffect ne
// tournait qu'une fois au premier chargement de page — après une
// connexion (LoginForm redirige via router.push, sans reload), il
// continuait à afficher "Se connecter" jusqu'au prochain rafraîchissement
// manuel (bug relevé le 2026-09-18). Re-vérifie donc sessionStorage à
// chaque changement de route, pas seulement au montage.
export default function AuthNavItem() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<{ role: string; matricule: string } | null>(null);

  useEffect(() => {
    const role = sessionStorage.getItem(ACCOUNT_ROLE_KEY);
    const matricule = sessionStorage.getItem(ACCOUNT_MATRICULE_KEY);
    setSession(role && matricule ? { role, matricule } : null);
  }, [pathname]);

  function logout() {
    sessionStorage.removeItem(ACCOUNT_ROLE_KEY);
    sessionStorage.removeItem(ACCOUNT_MATRICULE_KEY);
    setSession(null);
    router.push("/");
  }

  if (!session) {
    return (
      <Link href="/connexion" className="hover:text-accent">
        Se connecter
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <Link href={ROLE_ROUTES[session.role] ?? "/"} className="font-medium hover:text-accent">
        {session.matricule}
      </Link>
      <button
        type="button"
        onClick={logout}
        className="font-mono text-xs uppercase tracking-widest text-primary/50 hover:text-accent"
      >
        Se déconnecter
      </button>
    </span>
  );
}
