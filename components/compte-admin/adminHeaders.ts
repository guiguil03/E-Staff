import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

// Même pattern que dans ValidationRhPanel/PaiementsPanel/GroupesPanel —
// centralisé ici pour les nouveaux panneaux du Portail RH plutôt que
// redupliqué encore une fois.
//
// Envoie le matricule sous les deux noms de header (x-admin-matricule ET
// x-rh-matricule) depuis la scission Admin/RH du 2026-09-18 : chaque route
// backend ne vérifie que le header qui la concerne (AdminGuard ignore
// x-rh-matricule et vice versa), donc envoyer les deux ne pose aucun risque
// — seul celui qui correspond au VRAI rôle de la session pourra jamais
// matcher le secret attendu côté serveur. Évite de dupliquer cette
// fonction ou de faire suivre le rôle à chaque appelant.
export function adminHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-admin-matricule": matricule, "x-rh-matricule": matricule } : {};
}
