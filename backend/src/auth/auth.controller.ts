import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { AuthService } from "./auth.service";

// Login générique — stopgap pour Formateur/Admin (un identifiant de test
// partagé par rôle, petit nombre de personnes internes connues — voir
// brainstorm 2026-08-10). Apprenant a désormais de vrais comptes
// individuels (voir AuthService) : chaque candidat qui paie reçoit son
// propre matricule + mot de passe, généré à la confirmation de paiement.
const TEST_ACCOUNTS: { matricule?: string; password?: string; role: string }[] = [
  {
    matricule: process.env.FORMATEUR_TEST_MATRICULE,
    password: process.env.FORMATEUR_TEST_PASSWORD,
    role: "formateur",
  },
  {
    matricule: process.env.ADMIN_TEST_MATRICULE,
    password: process.env.ADMIN_TEST_PASSWORD,
    role: "admin",
  },
];

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() dto: LoginDto) {
    const account = TEST_ACCOUNTS.find(
      (a) => a.matricule && a.password && a.matricule === dto.matricule && a.password === dto.password
    );
    if (account) {
      return { ok: true, role: account.role };
    }

    const apprenant = await this.authService.loginApprenant(dto.matricule, dto.password);
    if (apprenant) {
      return { ok: true, role: "apprenant" };
    }

    throw new UnauthorizedException("Matricule ou mot de passe invalide.");
  }

  @Post("change-password")
  changePassword(@Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(dto);
  }

  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
