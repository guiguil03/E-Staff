import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { readSession } from "./session";
import { recordFailure, recordSuccess, remainingLockoutSeconds } from "./login-rate-limit";

// Gate des routes RH (clients & contrats, finances, pilotage) — même
// principe qu'AdminGuard : exige une session signée au login avec le rôle
// "rh", plutôt que l'ancien header `x-rh-matricule` comparé à un secret
// d'env partagé. Distinct d'AdminGuard depuis le 2026-09-18 (compte RH ->
// AdminGuard était surchargé, ventilé en deux comptes : Admin garde la
// génération de comptes/identifiants, les événements (réunions) et les
// rentrées ; RH récupère tout le reste — clients/contrats, finances,
// pilotage).
@Injectable()
export class RhGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `rh:${request.ip}`;

    const lockedFor = remainingLockoutSeconds(key);
    if (lockedFor > 0) {
      throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
    }

    const session = readSession(request);
    if (!session || session.role !== "rh") {
      recordFailure(key);
      throw new UnauthorizedException("Session RH invalide ou expirée.");
    }

    recordSuccess(key);
    return true;
  }
}
