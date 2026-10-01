import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { exigerSession } from "./garde-session";

// Gate des quelques routes genuinement partagées entre les comptes Admin et
// RH (ex. la liste des groupes avec places, utilisée à la fois par
// Académie/Formateurs — Admin — et par le pipeline de recrutement — RH) :
// accepte une session signée avec le rôle "admin" OU "rh". À ne pas
// utiliser par défaut — la plupart des routes doivent rester tranchées
// AdminGuard XOR RhGuard (voir rh.controller.ts) pour que la ventilation
// des accès reste lisible.
@Injectable()
export class StaffGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    await exigerSession(request, { cle: "staff", roles: ["admin", "rh"], message: "Accès refusé." });
    return true;
  }
}
