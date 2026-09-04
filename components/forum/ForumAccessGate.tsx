"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { ACCOUNT_ROLE_KEY } from "@/lib/accountSession";

// Le Forum n'a pas encore de contenu prêt pour le grand public (masqué le
// 2026-09-05, le temps d'en trouver) — mais reste accessible aux apprenants
// déjà connectés depuis leur tableau de bord (QuickActions "Accéder au
// Forum"). Fail-closed : rien n'est rendu tant que la vérification
// (sessionStorage, même stopgap que useRequireRole) n'a pas confirmé le
// rôle, et notFound() plutôt qu'une redirection vers /connexion — un
// visiteur public ne doit même pas soupçonner qu'il y a quelque chose ici.
export default function ForumAccessGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    setState(sessionStorage.getItem(ACCOUNT_ROLE_KEY) === "apprenant" ? "allowed" : "denied");
  }, []);

  if (state === "denied") notFound();
  if (state !== "allowed") return null;
  return <>{children}</>;
}
