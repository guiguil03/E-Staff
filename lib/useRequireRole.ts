"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ACCOUNT_ROLE_KEY } from "./accountSession";

// Garde d'accès partagée par les pages "Compte" (Apprenant, Formateur...).
// Stopgap sessionStorage en attendant le vrai système de comptes.
export function useRequireRole(role: string) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(ACCOUNT_ROLE_KEY) === role) {
      setChecked(true);
    } else {
      router.replace("/connexion");
    }
  }, [router, role]);

  return checked;
}
