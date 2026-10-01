import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Type,
  mixin,
} from "@nestjs/common";
import type { Request } from "express";
import { compterRequete } from "./anti-abus";

// Limite de requêtes par IP et par route publique (formulaires, dépôts de
// fichiers...) : `max` requêtes par fenêtre de `windowMs`. Compteurs en
// base depuis l'audit du 2026-09-28 (voir anti-abus.ts) : partagés entre
// instances et conservés après un redémarrage.
export function RateLimitGuard(keyPrefix: string, max: number, windowMs = 60_000): Type<CanActivate> {
  class RateLimitGuardImpl implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const compte = await compterRequete(`rl:${keyPrefix}:${request.ip}`, windowMs);
      if (compte > max) {
        throw new HttpException("Trop de requêtes. Réessayez dans une minute.", HttpStatus.TOO_MANY_REQUESTS);
      }
      return true;
    }
  }
  return mixin(RateLimitGuardImpl);
}
