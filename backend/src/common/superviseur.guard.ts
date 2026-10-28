import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { exigerSession } from "./garde-session";

// Gate des routes `superviseurs/:matricule/...` de l'Espace Superviseur :
// session signée au login avec le rôle "superviseur" ET dont le matricule
// est exactement celui de l'URL — même principe que l'AgentGuard, pour
// qu'un superviseur ne puisse pas lire l'équipe ou la paie d'un collègue en
// changeant le matricule dans l'URL.
@Injectable()
export class SuperviseurGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    await exigerSession(request, {
      cle: "superviseur",
      roles: ["superviseur"],
      message: "Session superviseur invalide ou expirée.",
      accepte: (s) => s.matricule === request.params?.matricule,
    });
    return true;
  }
}
