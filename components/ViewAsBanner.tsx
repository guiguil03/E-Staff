"use client";

import { useEffect, useState } from "react";
import {
  ACCOUNT_MATRICULE_KEY,
  ACCOUNT_ROLE_KEY,
  ACCOUNT_VIEW_AS_ADMIN_KEY,
} from "@/lib/accountSession";

// Bandeau affiché uniquement quand la session de cet onglet vient du bouton
// "Se connecter en tant que" du Casier Apprenant (voir useRequireRole) —
// pour qu'un admin ne confonde jamais cette vue avec sa propre session.
export default function ViewAsBanner() {
  const [matricule, setMatricule] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(ACCOUNT_VIEW_AS_ADMIN_KEY) === "true") {
      setMatricule(sessionStorage.getItem(ACCOUNT_MATRICULE_KEY));
    }
  }, []);

  if (!matricule) return null;

  function quitter() {
    sessionStorage.removeItem(ACCOUNT_ROLE_KEY);
    sessionStorage.removeItem(ACCOUNT_MATRICULE_KEY);
    sessionStorage.removeItem(ACCOUNT_VIEW_AS_ADMIN_KEY);
    window.close();
  }

  return (
    <div className="sticky top-0 z-50 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-2 bg-accent px-4 py-2 sm:-mx-6 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-obsidian">
        Vue admin — connecté en tant que {matricule}
      </p>
      <button
        onClick={quitter}
        className="rounded border border-obsidian/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-obsidian hover:bg-obsidian/10"
      >
        Quitter
      </button>
    </div>
  );
}
