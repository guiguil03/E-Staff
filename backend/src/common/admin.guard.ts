import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { readSession } from "./session";
import { recordFailure, recordSuccess, remainingLockoutSeconds } from "./login-rate-limit";

// Gate des routes d'administration : planification du Live du Forum, et
// depuis le 2026-09-18 la génération de comptes/identifiants (formateur,
// apprenant), les événements (réunions) et les rentrées (Vagues) côté
// Portail RH — le reste (clients/contrats, finances, pilotage) est passé à
// RhGuard (voir rh.guard.ts), le compte admin d'origine étant surchargé.
// Exige une session signée au login avec le rôle "admin" — remplace
// l'ancien stopgap qui comparait un header `x-admin-matricule` à un secret
// d'env partagé (secret forcément stocké côté client pour être renvoyé à
// chaque appel, donc exposé à tout XSS/historique réseau, sans expiration
// possible sans changer la variable d'env pour tout le monde à la fois).
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `admin:${request.ip}`;

    const lockedFor = remainingLockoutSeconds(key);
    if (lockedFor > 0) {
      throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
    }

    const session = readSession(request);
    if (!session || session.role !== "admin") {
      recordFailure(key);
      throw new UnauthorizedException("Session admin invalide ou expirée.");
    }

    recordSuccess(key);
    return true;
  }
}
