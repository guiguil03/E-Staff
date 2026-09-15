import * as crypto from "crypto";

// Jeton court, à usage unique, pour "Se connecter en tant que" (RH -> compte
// apprenant) : évite de transmettre le mot de passe réel de l'apprenant à
// l'admin, sans construire un vrai système d'impersonation avec session
// serveur. Store en mémoire (process unique, même principe que
// login-rate-limit.ts) — acceptable vu la durée de vie très courte du jeton
// (le temps que le nouvel onglet s'ouvre et le consomme).
const TTL_MS = 60 * 1000; // 60s

interface Entry {
  matricule: string;
  role: string;
  expiresAt: number;
}

const tokens = new Map<string, Entry>();

export function createViewAsToken(matricule: string, role: string): string {
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(token, { matricule, role, expiresAt: Date.now() + TTL_MS });
  return token;
}

// Usage unique : le jeton est supprimé qu'il soit valide ou non, pour qu'un
// lien intercepté ne puisse pas être rejoué.
export function consumeViewAsToken(token: string): { matricule: string; role: string } | null {
  const entry = tokens.get(token);
  tokens.delete(token);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return { matricule: entry.matricule, role: entry.role };
}
