import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { exigerSession } from "./garde-session";

// Gate des routes `apprenants/:matricule/...` du Compte Apprenant
// (notation, classe-virtuelle) : jusqu'ici ces routes n'avaient AUCUNE
// garde, le matricule de l'URL faisant office d'unique "identifiant" — et
// les matricules apprenants sont séquentiels (ETF-2026-0001, 0002...), donc
// devinables par simple incrémentation. Exige désormais une session signée
// au login avec le rôle "apprenant" ET dont le matricule correspond
// exactement à celui de l'URL — un apprenant authentifié ne peut consulter
// ou modifier que SES propres données, jamais celles d'un autre matricule
// deviné.
@Injectable()
export class ApprenantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    await exigerSession(request, {
      cle: "apprenant",
      roles: ["apprenant"],
      message: "Session apprenant invalide ou expirée.",
      accepte: (s) => s.matricule === request.params?.matricule,
    });
    return true;
  }
}
