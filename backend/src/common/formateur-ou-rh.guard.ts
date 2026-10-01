import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { exigerSession } from "./garde-session";

// Gate des quelques ressources consultées à la fois par le formateur (file
// de correction, TrainerDashboard) et par la RH (vérification des
// coordonnées candidat, CoordonneesPanel) — ex. le flux vidéo d'une réponse
// candidat. Même principe que StaffGuard (admin OU rh), pour formateur OU
// rh.
@Injectable()
export class FormateurOuRhGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    await exigerSession(request, { cle: "formateur-ou-rh", roles: ["formateur", "rh"], message: "Accès refusé." });
    return true;
  }
}
