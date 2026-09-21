import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { readSession } from "./session";

// Gate des quelques ressources consultées à la fois par le formateur (file
// de correction, TrainerDashboard) et par la RH (vérification des
// coordonnées candidat, CoordonneesPanel) — ex. le flux vidéo d'une réponse
// candidat. Même principe que StaffGuard (admin OU rh), pour formateur OU
// rh.
@Injectable()
export class FormateurOuRhGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const session = readSession(request);
    if (!session || (session.role !== "formateur" && session.role !== "rh")) {
      throw new UnauthorizedException("Accès refusé.");
    }
    return true;
  }
}
