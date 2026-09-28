"use client";

import { useEffect } from "react";
import { initialiserSuiviErreurs } from "@/lib/suiviErreurs";

// Démarre le suivi des erreurs au chargement (voir lib/suiviErreurs.ts).
export default function SuiviErreurs() {
  useEffect(() => {
    void initialiserSuiviErreurs();
  }, []);
  return null;
}
