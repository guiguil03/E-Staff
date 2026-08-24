// Anti-brute-force minimal pour les gates par code/matricule partagé
// (TrainerGuard, FormateurGuard, AdminGuard, /auth/login) — ces codes sont
// des secrets partagés mémorisables (pas de mot de passe fort), donc sans
// limite de tentatives ils sont devinables par force brute. Store en mémoire
// (process unique, comme le reste des stopgaps de ce projet) : suffisant vu
// le volume et repart à zéro à chaque redéploiement, ce qui est acceptable
// pour ce niveau de risque.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 min

interface Entry {
  count: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, Entry>();

export function remainingLockoutSeconds(key: string): number {
  const entry = attempts.get(key);
  if (!entry?.lockedUntil) return 0;
  const remainingMs = entry.lockedUntil - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

export function recordFailure(key: string): void {
  const entry = attempts.get(key) ?? { count: 0, lockedUntil: null };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
  }
  attempts.set(key, entry);
}

export function recordSuccess(key: string): void {
  attempts.delete(key);
}
