import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { recordFailure, recordSuccess, remainingLockoutSeconds } from "./login-rate-limit";

// Gate des routes RH (clients & contrats, finances, pilotage) — même pattern
// qu'AdminGuard : le matricule envoyé dans le header `x-rh-matricule` doit
// correspondre au compte de test RH_TEST_MATRICULE. Distinct d'AdminGuard
// depuis le 2026-09-18 (compte RH -> AdminGuard était surchargé, ventilé
// en deux comptes : Admin garde la génération de comptes/identifiants, les
// événements (réunions) et les rentrées ; RH récupère tout le reste —
// clients/contrats, finances, pilotage). Anti-brute-force par IP (voir
// login-rate-limit.ts).
@Injectable()
export class RhGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `rh:${request.ip}`;

    const lockedFor = remainingLockoutSeconds(key);
    if (lockedFor > 0) {
      throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
    }

    const matricule = request.headers["x-rh-matricule"];
    const expected = process.env.RH_TEST_MATRICULE;

    if (!expected || matricule !== expected) {
      recordFailure(key);
      throw new UnauthorizedException("Matricule RH invalide.");
    }
    recordSuccess(key);
    return true;
  }
}
