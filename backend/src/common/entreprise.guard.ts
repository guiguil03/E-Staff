import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { exigerSession } from "./garde-session";

// Gate des routes `entreprises-comptes/:matricule/...` de l'Espace
// Entreprise : session signée au login avec le rôle "entreprise" ET dont le
// matricule est exactement celui de l'URL — même principe que
// SuperviseurGuard/AgentGuard, pour qu'une entreprise cliente ne puisse pas
// lire le tableau de bord ou le casier d'une autre en changeant le
// matricule dans l'URL.
@Injectable()
export class EntrepriseGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    await exigerSession(request, {
      cle: "entreprise",
      roles: ["entreprise"],
      message: "Session entreprise invalide ou expirée.",
      accepte: (s) => s.matricule === request.params?.matricule,
    });
    return true;
  }
}
