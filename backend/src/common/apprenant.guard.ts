import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { readSession } from "./session";
import { recordFailure, recordSuccess, remainingLockoutSeconds } from "./login-rate-limit";

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
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `apprenant:${request.ip}`;

    // Une session signée valide pour CE matricule passe toujours, même si
    // l'IP est verrouillée : un JWT signé ne se devine pas, donc le
    // verrouillage n'a rien à protéger ici. Avant, 5 échecs depuis une même
    // IP (un onglet resté sur une session expirée ou sur le cookie d'un
    // autre rôle, qui repolle toutes les 60s) bloquaient pendant 15 min
    // TOUS les apprenants derrière cette IP (centre de formation, Wi-Fi
    // partagé, test formateur + apprenant sur la même machine) — ils ne
    // voyaient plus les classes virtuelles planifiées (signalement du
    // 2026-09-24).
    const session = readSession(request);
    const matricule = request.params?.matricule;
    if (session && session.role === "apprenant" && session.matricule === matricule) {
      recordSuccess(key);
      return true;
    }

    const lockedFor = remainingLockoutSeconds(key);
    if (lockedFor > 0) {
      throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
    }

    recordFailure(key);
    throw new UnauthorizedException("Session apprenant invalide ou expirée.");
  }
}
