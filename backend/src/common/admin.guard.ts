import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

// Gate des routes d'administration (planification du Live du Forum) — même
// pattern que FormateurGuard : le matricule admin envoyé dans le header
// `x-admin-matricule` doit correspondre au compte de test ADMIN_TEST_MATRICULE.
// Stopgap comme le reste des comptes de test, à remplacer par une vraie
// auth (module 7 de la roadmap).
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const matricule = request.headers["x-admin-matricule"];
    const expected = process.env.ADMIN_TEST_MATRICULE;

    if (!expected || matricule !== expected) {
      throw new UnauthorizedException("Matricule admin invalide.");
    }
    return true;
  }
}
