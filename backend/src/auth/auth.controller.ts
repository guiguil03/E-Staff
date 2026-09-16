import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ConsumeViewAsTokenDto } from "./dto/consume-view-as-token.dto";
import { AuthService } from "./auth.service";
import { AdminGuard } from "../common/admin.guard";
import { recordFailure, recordSuccess, remainingLockoutSeconds } from "../common/login-rate-limit";
import { consumeViewAsToken } from "../common/view-as-token";

// Login générique — stopgap pour Admin (un identifiant de test partagé,
// une seule personne concernée). Apprenant ET Formateur ont désormais de
// vrais comptes individuels (voir AuthService) : chaque candidat qui paie
// reçoit son propre matricule + mot de passe (confirmation de paiement),
// chaque formateur reçoit le sien à la création par la RH
// (RhService.createFormateur).
const TEST_ACCOUNTS: { matricule?: string; password?: string; role: string }[] = [
  {
    matricule: process.env.ADMIN_TEST_MATRICULE,
    password: process.env.ADMIN_TEST_PASSWORD,
    role: "admin",
  },
];

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() dto: LoginDto, @Req() request: Request) {
    // Anti-brute-force par IP (voir login-rate-limit.ts) — protège à la fois
    // les codes de test partagés (formateur/admin) et les vrais mots de
    // passe apprenant.
    const key = `login:${request.ip}`;
    const lockedFor = remainingLockoutSeconds(key);
    if (lockedFor > 0) {
      throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
    }

    const account = TEST_ACCOUNTS.find(
      (a) => a.matricule && a.password && a.matricule === dto.matricule && a.password === dto.password
    );
    if (account) {
      recordSuccess(key);
      return { ok: true, role: account.role };
    }

    const formateur = await this.authService.loginFormateur(dto.matricule, dto.password);
    if (formateur) {
      recordSuccess(key);
      return { ok: true, role: "formateur" };
    }

    const apprenant = await this.authService.loginApprenant(dto.matricule, dto.password);
    if (apprenant) {
      recordSuccess(key);
      return { ok: true, role: "apprenant" };
    }

    recordFailure(key);
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

  // "Se connecter en tant que" (RH -> compte apprenant) — voir
  // AuthService.createApprenantViewAsToken. Génération réservée à l'admin ;
  // la consommation ci-dessous reste publique (c'est le nouvel onglet, sans
  // session admin, qui l'appelle).
  @UseGuards(AdminGuard)
  @Post("view-as/:matricule")
  createViewAs(@Param("matricule") matricule: string) {
    return this.authService.createApprenantViewAsToken(matricule);
  }

  // "Se connecter en tant que" (RH -> compte formateur) — voir
  // AuthService.createFormateurViewAsToken. Chemin distinct du précédent
  // (déjà utilisé par le Casier Apprenant) pour ne rien casser côté front.
  @UseGuards(AdminGuard)
  @Post("view-as/formateur/:matricule")
  createFormateurViewAs(@Param("matricule") matricule: string) {
    return this.authService.createFormateurViewAsToken(matricule);
  }

  @Post("view-as/consume")
  consumeViewAs(@Body() dto: ConsumeViewAsTokenDto) {
    const result = consumeViewAsToken(dto.token);
    if (!result) {
      throw new UnauthorizedException("Lien de connexion invalide ou expiré.");
    }
    return result;
  }
}
