import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { recordFailure, recordSuccess, remainingLockoutSeconds } from "./login-rate-limit";

// Gate des routes de planification du Cockpit Formateur (classe-virtuelle
// module) : le matricule formateur envoyé dans le header
// `x-formateur-matricule` doit correspondre soit au compte de test
// FORMATEUR_TEST_MATRICULE (toujours actif, démo/dev), soit à un vrai
// Formateur en base (voir migration formateur_auth, RhService.createFormateur).
// Distinct de TrainerGuard (qui protège l'espace formateur autonome
// /evaluation/formateur avec un code partagé) — le Cockpit Formateur a déjà
// son propre login par matricule (lib/accountSession.ts), donc on réutilise
// ce même identifiant plutôt que de redemander un second secret sans
// rapport. Anti-brute-force par IP (voir login-rate-limit.ts) depuis
// 2026-08-24 : un matricule reste plus facile à deviner qu'un mot de passe.
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
    const expected = process.env.FORMATEUR_TEST_MATRICULE;

    const isTestAccount = typeof matricule === "string" && !!expected && matricule === expected;
    const isRealFormateur =
      typeof matricule === "string" &&
      !isTestAccount &&
      (await this.prisma.formateur.findUnique({ where: { matricule } })) !== null;

    if (!isTestAccount && !isRealFormateur) {
      recordFailure(key);
      throw new UnauthorizedException("Matricule formateur invalide.");
    }
    recordSuccess(key);
    return true;
  }
}
