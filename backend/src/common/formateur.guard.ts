import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { recordFailure, recordSuccess, remainingLockoutSeconds } from "./login-rate-limit";

// Gate des routes de planification du Cockpit Formateur (classe-virtuelle
// module) : le matricule formateur envoyé dans le header
// `x-formateur-matricule` doit correspondre au compte de test
// FORMATEUR_TEST_MATRICULE. Distinct de TrainerGuard (qui protège l'espace
// formateur autonome /evaluation/formateur avec un code partagé) — le
// Cockpit Formateur a déjà son propre login par matricule
// (lib/accountSession.ts), donc on réutilise ce même identifiant plutôt que
// de redemander un second secret sans rapport. Stopgap comme le reste des
// comptes de test, à remplacer par une vraie auth (module 7 de la roadmap).
// Anti-brute-force par IP (voir login-rate-limit.ts) depuis 2026-08-24 : ce
// matricule est un secret partagé mémorisable, pas un mot de passe fort.
@Injectable()
export class FormateurGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `formateur:${request.ip}`;

    const lockedFor = remainingLockoutSeconds(key);
    if (lockedFor > 0) {
      throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
    }

    const matricule = request.headers["x-formateur-matricule"];
    const expected = process.env.FORMATEUR_TEST_MATRICULE;

    if (!expected || matricule !== expected) {
      recordFailure(key);
      throw new UnauthorizedException("Matricule formateur invalide.");
    }
    recordSuccess(key);
    return true;
  }
}
