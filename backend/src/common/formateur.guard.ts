import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { exigerSession } from "./garde-session";

// Gate des routes du Cockpit Formateur (classe-virtuelle, notation,
// cockpit) : exige une session signée au login (voir AuthService.loginFormateur
// + AuthController.login) avec le rôle "formateur" — remplace l'ancien
// stopgap qui faisait confiance à un header `x-formateur-matricule`
// auto-déclaré par le client (n'importe qui connaissant un matricule
// pouvait alors usurper le compte, mot de passe ou pas).
//
// Le matricule de la session (garanti authentique, signé serveur) est
// réinjecté dans `x-formateur-matricule` pour que les controllers/services
// existants (qui lisent ce header) continuent de fonctionner sans
// modification — mais sa valeur n'est plus jamais celle envoyée par le
// client.
@Injectable()
export class FormateurGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const session = await exigerSession(request, { cle: "formateur", roles: ["formateur"], message: "Session formateur invalide ou expirée." });
    request.headers["x-formateur-matricule"] = session.matricule;
    return true;
  }
}
