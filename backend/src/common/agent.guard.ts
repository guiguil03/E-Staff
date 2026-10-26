import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { exigerSession } from "./garde-session";

// Gate des routes `agents/:matricule/...` de l'Espace Agent (performances,
// dossier, contrat, paiements) : même principe que l'ApprenantGuard —
// exige une session signée au login avec le rôle "agent" ET dont le
// matricule correspond exactement à celui de l'URL. Les matricules agents
// sont séquentiels ("ETF-AG-2026-0001", 0002...), donc devinables : sans
// cette égalité, un agent authentifié pourrait lire la paie et les
// performances d'un collègue en incrémentant le numéro.
//
// Les routes de gestion (annuaire, création de compte, saisie du suivi)
// sont, elles, gardées par RhGuard côté Production — voir
// agents.controller.ts.
@Injectable()
export class AgentGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    await exigerSession(request, {
      cle: "agent",
      roles: ["agent"],
      message: "Session agent invalide ou expirée.",
      accepte: (s) => s.matricule === request.params?.matricule,
    });
    return true;
  }
}
