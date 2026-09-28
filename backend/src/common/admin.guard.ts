import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { exigerSession } from "./garde-session";

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
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    await exigerSession(request, { cle: "admin", roles: ["admin"], message: "Session admin invalide ou expirée." });
    return true;
  }
}
