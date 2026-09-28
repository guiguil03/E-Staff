import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { exigerSession } from "./garde-session";

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
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    await exigerSession(request, { cle: "rh", roles: ["rh"], message: "Session RH invalide ou expirée." });
    return true;
  }
}
