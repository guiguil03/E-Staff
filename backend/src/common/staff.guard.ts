import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { readSession } from "./session";
import { recordFailure, recordSuccess, remainingLockoutSeconds } from "./login-rate-limit";

// Gate des quelques routes genuinement partagées entre les comptes Admin et
// RH (ex. la liste des groupes avec places, utilisée à la fois par
// Académie/Formateurs — Admin — et par le pipeline de recrutement — RH) :
// accepte une session signée avec le rôle "admin" OU "rh". À ne pas
// utiliser par défaut — la plupart des routes doivent rester tranchées
// AdminGuard XOR RhGuard (voir rh.controller.ts) pour que la ventilation
// des accès reste lisible.
@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `staff:${request.ip}`;

    const lockedFor = remainingLockoutSeconds(key);
    if (lockedFor > 0) {
      throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
    }

    const session = readSession(request);
    if (!session || (session.role !== "admin" && session.role !== "rh")) {
      recordFailure(key);
      throw new UnauthorizedException("Accès refusé.");
    }

    recordSuccess(key);
    return true;
  }
}
