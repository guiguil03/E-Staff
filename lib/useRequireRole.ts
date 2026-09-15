"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, ApiError } from "./api";
import { ACCOUNT_MATRICULE_KEY, ACCOUNT_ROLE_KEY, ACCOUNT_VIEW_AS_ADMIN_KEY } from "./accountSession";

// Garde d'accès partagée par les pages "Compte" (Apprenant, Formateur...).
// Stopgap sessionStorage en attendant le vrai système de comptes.
//
// Gère aussi le jeton "?viewAsToken=..." posé par le bouton "Se connecter en
// tant que" du Casier Apprenant (voir ApprenantCasierPanel) : consommé une
// seule fois auprès du backend (usage unique, courte durée de vie — voir
// AuthController.consumeViewAs), il pose la session apprenant dans ce nouvel
// onglet sans jamais transmettre le vrai mot de passe à l'admin.
export function useRequireRole(role: string) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const params = new URLSearchParams(window.location.search);
      const viewAsToken = params.get("viewAsToken");

      if (viewAsToken) {
        try {
          const result = await apiPost<{ matricule: string; role: string }>(
            "/auth/view-as/consume",
            { token: viewAsToken }
          );
          if (result.role === role) {
            sessionStorage.setItem(ACCOUNT_ROLE_KEY, result.role);
            sessionStorage.setItem(ACCOUNT_MATRICULE_KEY, result.matricule);
            sessionStorage.setItem(ACCOUNT_VIEW_AS_ADMIN_KEY, "true");
            params.delete("viewAsToken");
            const query = params.toString();
            router.replace(window.location.pathname + (query ? `?${query}` : ""));
            if (!cancelled) setChecked(true);
            return;
          }
        } catch (err) {
          if (!(err instanceof ApiError)) throw err;
          // Jeton invalide/expiré : retombe sur le contrôle de session normal.
        }
      }

      if (sessionStorage.getItem(ACCOUNT_ROLE_KEY) === role) {
        if (!cancelled) setChecked(true);
      } else {
        router.replace("/connexion");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, role]);

  return checked;
}
