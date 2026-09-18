import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { recordFailure, recordSuccess, remainingLockoutSeconds } from "./login-rate-limit";

// Gate des quelques routes genuinement partagées entre les comptes Admin et
// RH (ex. la liste des groupes avec places, utilisée à la fois par
// Académie/Formateurs — Admin — et par le pipeline de recrutement — RH) :
// accepte l'un OU l'autre des deux matricules de test. À ne pas utiliser
// par défaut — la plupart des routes doivent rester tranchées AdminGuard
// XOR RhGuard (voir rh.controller.ts) pour que la ventilation des accès
// reste lisible.
@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `staff:${request.ip}`;

    const lockedFor = remainingLockoutSeconds(key);
    if (lockedFor > 0) {
      throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
    }

    const adminMatricule = request.headers["x-admin-matricule"];
    const rhMatricule = request.headers["x-rh-matricule"];
    const isAdmin = !!process.env.ADMIN_TEST_MATRICULE && adminMatricule === process.env.ADMIN_TEST_MATRICULE;
    const isRh = !!process.env.RH_TEST_MATRICULE && rhMatricule === process.env.RH_TEST_MATRICULE;

    if (!isAdmin && !isRh) {
      recordFailure(key);
      throw new UnauthorizedException("Accès refusé.");
    }
    recordSuccess(key);
    return true;
  }
}
