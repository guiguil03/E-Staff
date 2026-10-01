import { randomBytes } from "crypto";

// Jeton des liens publics envoyés par e-mail (contrat, paiement) — audit
// du 2026-09-28. Avant, l'identifiant de la ligne (cuid) servait de clé :
// difficile à deviner mais pas conçu pour être secret (horodatage +
// compteur). 32 octets aléatoires, non devinables.
export function nouveauLienToken(): string {
  return randomBytes(32).toString("base64url");
}

// Recherche par jeton ; l'identifiant n'est accepté que pour les lignes
// créées avant l'introduction des jetons (accesParIdAutorise, positionné
// par la migration), pour ne pas casser les liens déjà envoyés.
export function whereLien(param: string) {
  return { OR: [{ lienToken: param }, { id: param, accesParIdAutorise: true }] };
}
