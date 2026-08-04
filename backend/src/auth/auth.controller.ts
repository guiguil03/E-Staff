import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";

// Login générique — stopgap. Il n'existe pas encore de vrai système de
// comptes/rôles (module 7 de la roadmap) ; en attendant, un identifiant de
// test unique par rôle permet d'accéder au tableau de bord correspondant
// pour valider le design avec la cliente. Un seul endpoint pour tous les
// rôles (plutôt qu'un par rôle) — le rôle est déterminé par les identifiants
// fournis et renvoyé dans la réponse pour que le front sache où rediriger.
// À remplacer par une vraie authentification par matricule individuel quand
// le module RH/inscription existera.
const TEST_ACCOUNTS: { matricule?: string; password?: string; role: string }[] = [
  {
    matricule: process.env.APPRENANT_TEST_MATRICULE,
    password: process.env.APPRENANT_TEST_PASSWORD,
    role: "apprenant",
  },
];

@Controller("auth")
export class AuthController {
  @Post("login")
  login(@Body() dto: LoginDto) {
    const account = TEST_ACCOUNTS.find(
      (a) => a.matricule && a.password && a.matricule === dto.matricule && a.password === dto.password
    );

    if (!account) {
      throw new UnauthorizedException("Matricule ou mot de passe invalide.");
    }

    return { ok: true, role: account.role };
  }
}
