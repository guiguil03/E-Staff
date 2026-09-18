import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { recordFailure, recordSuccess, remainingLockoutSeconds } from "./login-rate-limit";

// Gate des routes d'administration : planification du Live du Forum, et
// depuis le 2026-09-18 la génération de comptes/identifiants (formateur,
// apprenant), les événements (réunions) et les rentrées (Vagues) côté
// Portail RH — le reste (clients/contrats, finances, pilotage) est passé à
// RhGuard (voir rh.guard.ts), le compte admin d'origine étant surchargé.
// Même pattern que FormateurGuard : le matricule admin envoyé dans le
// header `x-admin-matricule` doit correspondre au compte de test
// ADMIN_TEST_MATRICULE. Stopgap comme le reste des comptes de test, à
// remplacer par une vraie auth (module 7 de la roadmap). Anti-brute-force
// par IP depuis 2026-08-24 (voir login-rate-limit.ts).
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `admin:${request.ip}`;

    const lockedFor = remainingLockoutSeconds(key);
    if (lockedFor > 0) {
      throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
    }

    const matricule = request.headers["x-admin-matricule"];
    const expected = process.env.ADMIN_TEST_MATRICULE;

    if (!expected || matricule !== expected) {
      recordFailure(key);
      throw new UnauthorizedException("Matricule admin invalide.");
    }
    recordSuccess(key);
    return true;
  }
}
