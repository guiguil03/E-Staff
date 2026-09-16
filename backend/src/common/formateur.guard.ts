import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { recordFailure, recordSuccess, remainingLockoutSeconds } from "./login-rate-limit";

// Gate des routes du Cockpit Formateur (classe-virtuelle, notation,
// cockpit) : le matricule envoyé dans le header `x-formateur-matricule`
// doit correspondre à un compte Formateur réel (2026-09-16 — avant cette
// date, un unique code partagé FORMATEUR_TEST_MATRICULE faisait office de
// "compte"). Le mot de passe est vérifié une seule fois, à la connexion
// (AuthService.loginFormateur) : ce guard ne revérifie que l'identité pour
// chaque appel ensuite, même niveau de confiance que le reste du stopgap
// (Apprenant n'a même pas de garde équivalente). C'est cette identité qui
// permet maintenant de filtrer chaque service par formateurId (voir
// CockpitService.getGroupes, NotationService.listACorriger, etc.) plutôt que
// de tout montrer à tout le monde. Anti-brute-force par IP conservé (voir
// login-rate-limit.ts) : un matricule reste devinable par essais répétés.
@Injectable()
export class FormateurGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `formateur:${request.ip}`;

    const lockedFor = remainingLockoutSeconds(key);
    if (lockedFor > 0) {
      throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
    }

    const matricule = request.headers["x-formateur-matricule"];
    if (typeof matricule !== "string" || !matricule) {
      recordFailure(key);
      throw new UnauthorizedException("Matricule formateur invalide.");
    }

    const formateur = await this.prisma.formateur.findUnique({ where: { matricule } });
    if (!formateur) {
      recordFailure(key);
      throw new UnauthorizedException("Matricule formateur invalide.");
    }

    recordSuccess(key);
    return true;
  }
}
