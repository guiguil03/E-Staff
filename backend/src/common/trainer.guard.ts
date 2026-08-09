import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

// Gate temporaire de l'interface formateur : un code partagé
// (TRAINER_ACCESS_CODE) envoyé dans le header `x-trainer-code`.
// Le site n'a pas encore de vrai système de comptes (rôle "Formateur" prévu
// au module 3 de la roadmap) — ce guard est un stopgap fonctionnel, pas une
// fausse façade, mais doit être remplacé par une vraie auth avant mise en
// production réelle avec des candidats.
@Injectable()
export class TrainerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const code = request.headers["x-trainer-code"];
    const expected = process.env.TRAINER_ACCESS_CODE;

    if (!expected || code !== expected) {
      throw new UnauthorizedException("Code formateur invalide.");
    }
    return true;
  }
}
