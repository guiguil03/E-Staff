// Anti-brute-force de la connexion et des guards : 5 échecs → verrou de
// 15 minutes par clé (ex. `login:<ip>`). Compteurs en base depuis l'audit
// du 2026-09-28 (voir anti-abus.ts) : partagés entre instances et conservés
// après un redémarrage.
import { effacerEchecs, enregistrerEchec, secondesVerrouRestantes } from "./anti-abus";

export function remainingLockoutSeconds(key: string): Promise<number> {
  return secondesVerrouRestantes(key);
}

export function recordFailure(key: string): Promise<void> {
  return enregistrerEchec(key);
}

export function recordSuccess(key: string): Promise<void> {
  return effacerEchecs(key);
}
