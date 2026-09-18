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
// `role` accepte un seul rôle ou un tableau (ex. ["admin", "rh"] pour une
// page du Portail ouverte aux deux depuis la scission du 2026-09-18 — voir
// ROLE_ROUTES). Le tableau est comparé par valeur à chaque rendu ; passer
// un littéral inline (`["admin", "rh"]`) est ok, la dépendance de l'effet
// se base sur sa forme sérialisée, pas sur l'identité de la référence.
export function useRequireRole(role: string | string[]) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const roles = Array.isArray(role) ? role : [role];
  const rolesKey = roles.join(",");

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
          if (roles.includes(result.role)) {
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

      if (roles.includes(sessionStorage.getItem(ACCOUNT_ROLE_KEY) ?? "")) {
        if (!cancelled) setChecked(true);
      } else {
        router.replace("/connexion");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, rolesKey]);

  return checked;
}
