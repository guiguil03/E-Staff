import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Type,
  mixin,
} from "@nestjs/common";
import type { Request } from "express";

// Anti-abus générique par IP — distinct de login-rate-limit.ts, qui gère
// spécifiquement le lockout après des échecs d'authentification (bon
// identifiant/mauvais secret). Ici, TOUTE requête compte (upload de CV/
// vidéo, création de compte, webhook Papi) : ces endpoints sont publics et
// n'ont jusqu'ici aucune limite de fréquence — un script pouvait les
// marteler sans jamais être bloqué. Store en mémoire, comme le reste des
// anti-abus du projet (process unique, repart à zéro à chaque déploiement).
interface Entry {
  count: number;
  windowStart: number;
}
const hits = new Map<string, Entry>();

function checkAndRecord(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    hits.set(key, { count: 1, windowStart: now });
    return;
  }
  entry.count += 1;
  if (entry.count > max) {
    throw new HttpException("Trop de requêtes. Réessayez dans une minute.", HttpStatus.TOO_MANY_REQUESTS);
  }
}

// Fabrique un guard paramétré : `keyPrefix` isole le compteur par route (un
// abus sur l'upload CV ne verrouille pas la création de compte), `max`
// requêtes par IP toutes les `windowMs` (défaut 60s).
export function RateLimitGuard(keyPrefix: string, max: number, windowMs = 60_000): Type<CanActivate> {
  class RateLimitGuardImpl implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<Request>();
      checkAndRecord(`${keyPrefix}:${request.ip}`, max, windowMs);
      return true;
    }
  }
  return mixin(RateLimitGuardImpl);
}
