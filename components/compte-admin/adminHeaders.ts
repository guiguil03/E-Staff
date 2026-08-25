import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

// Même pattern que dans ValidationRhPanel/PaiementsPanel/GroupesPanel —
// centralisé ici pour les nouveaux panneaux du Portail RH plutôt que
// redupliqué encore une fois.
export function adminHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-admin-matricule": matricule } : {};
}
