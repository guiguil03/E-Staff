import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ConsumeViewAsTokenDto } from "./dto/consume-view-as-token.dto";
import { AuthService } from "./auth.service";
import { AdminGuard } from "../common/admin.guard";
import { RateLimitGuard } from "../common/rate-limit.guard";
import { recordFailure, recordSuccess, remainingLockoutSeconds } from "../common/login-rate-limit";
import { consumeViewAsToken } from "../common/view-as-token";
import {
  clearSessionCookie,
  setViewAsSessionCookie,
  identifiantPartage,
  identifiantPartageAutorise,
  readSession,
  setSessionCookie,
  SessionRole,
  verifierSession,
} from "../common/session";
import { StaffGuard } from "../common/staff.guard";

// Identifiants partagés Admin/RH (ADMIN_TEST_* / RH_TEST_*) : uniquement
// pour démarrer. Dès qu'un compte nominatif actif existe pour un rôle
// (Paramètres > Comptes d'accès, voir CompteStaff), l'identifiant partagé de
// ce rôle est refusé (audit du 2026-09-28). Apprenants et formateurs ont
// chacun leur compte (voir AuthService).
function comparerTexte(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    // Anti-brute-force par IP (voir login-rate-limit.ts) — protège à la fois
    // les codes de test partagés (formateur/admin) et les vrais mots de
    // passe apprenant.
    const key = `login:${request.ip}`;
    const lockedFor = await remainingLockoutSeconds(key);
    if (lockedFor > 0) {
      throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
    }

    const connecter = async (matricule: string, role: SessionRole) => {
      await recordSuccess(key);
      setSessionCookie(response, { matricule, role });
      return { ok: true, role };
    };

    const staff = await this.authService.loginStaff(dto.matricule, dto.password);
    if (staff) return connecter(staff.matricule, staff.role as SessionRole);

    for (const role of ["admin", "rh"] as const) {
      const partage = identifiantPartage(role);
      if (
        partage.matricule &&
        partage.password &&
        comparerTexte(dto.matricule, partage.matricule) &&
        comparerTexte(dto.password, partage.password)
      ) {
        if (!(await identifiantPartageAutorise(role))) {
          await recordFailure(key);
          throw new UnauthorizedException(
            "Cet identifiant partagé est désactivé : connectez-vous avec votre compte personnel."
          );
        }
        return connecter(partage.matricule, role);
      }
    }

    const formateur = await this.authService.loginFormateur(dto.matricule, dto.password);
    if (formateur) return connecter(formateur.matricule, "formateur");

    const apprenant = await this.authService.loginApprenant(dto.matricule, dto.password);
    if (apprenant) return connecter(apprenant.matricule, "apprenant");

    await recordFailure(key);
    throw new UnauthorizedException("Matricule ou mot de passe invalide.");
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response) {
    clearSessionCookie(response);
    return { ok: true };
  }

  // Vérifie l'ancien mot de passe : même anti-brute-force que le login
  // (audit du 2026-09-28) — sans ça, cette route permettait de tester des
  // mots de passe à l'infini en contournant le verrouillage du login.
  // Vérifie l'ancien mot de passe : même anti-brute-force que le login
  // (audit du 2026-09-28). Le changement déconnecte toutes les autres
  // sessions du compte ; celle en cours reçoit un nouveau cookie.
  @Post("change-password")
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const key = `login:${request.ip}`;
    const lockedFor = await remainingLockoutSeconds(key);
    if (lockedFor > 0) {
      throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
    }
    try {
      const courante = readSession(request);
      const result = await this.authService.changePassword(dto);
      await recordSuccess(key);
      if (courante && courante.matricule === dto.matricule) {
        setSessionCookie(response, { matricule: courante.matricule, role: courante.role });
      }
      return result;
    } catch (err) {
      if (err instanceof UnauthorizedException) await recordFailure(key);
      throw err;
    }
  }

  // « Déconnecter tous mes appareils » : révoque toutes les sessions du
  // compte connecté, y compris celle-ci.
  @Post("logout-everywhere")
  async logoutEverywhere(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const session = await verifierSession(request);
    clearSessionCookie(response);
    if (!session) throw new UnauthorizedException("Session invalide ou expirée.");
    // Identifiant partagé Admin/RH : pas de compte en base à révoquer, on
    // déconnecte seulement ce navigateur (créer des comptes personnels).
    if (!(await this.authService.compteExiste(session.matricule))) return { ok: true, partage: true };
    await this.authService.revoquerSessions(session.matricule);
    return { ok: true };
  }

  // Admin/RH : déconnecter partout un formateur, un apprenant ou un compte
  // staff (ex. appareil perdu, départ d'un collaborateur).
  @UseGuards(StaffGuard)
  @Post("revoquer-sessions/:matricule")
  revoquerSessions(@Param("matricule") matricule: string) {
    return this.authService.revoquerSessions(matricule);
  }

  // Envoie un e-mail : limité pour qu'on ne puisse pas inonder la boîte
  // d'un compte (audit du 2026-09-28).
  @UseGuards(RateLimitGuard("auth-forgot-password", 5))
  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @UseGuards(RateLimitGuard("auth-reset-password", 10))
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // Doit rester déclarée AVANT `view-as/:matricule` : Express prend la première
  // route qui correspond, et "consume" serait sinon lu comme un matricule
  // (garde RH -> 401 pour le nouvel onglet, le jeton n'étant jamais consommé).
  @UseGuards(RateLimitGuard("auth-view-as-consume", 10))
  @Post("view-as/consume")
  consumeViewAs(
    @Body() dto: ConsumeViewAsTokenDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = consumeViewAsToken(dto.token);
    if (!result) {
      throw new UnauthorizedException("Lien de connexion invalide ou expiré.");
    }
    // Pose la session du nouvel onglet (rôle/matricule ciblés) au même
    // titre qu'un vrai login — sans ça, les routes désormais gardées par
    // FormateurGuard/ApprenantGuard resteraient inaccessibles depuis une
    // session "se connecter en tant que".
    setViewAsSessionCookie(response, {
      matricule: result.matricule,
      role: result.role as SessionRole,
    });
    return result;
  }

  // "Se connecter en tant que" (RH -> compte apprenant) — voir
  // AuthService.createApprenantViewAsToken. Appelé depuis le Casier
  // Apprenant (page RH) — génération réservée au staff (Admin ou RH) ; la consommation
  // ci-dessous reste publique (c'est le nouvel onglet, sans session RH,
  // qui l'appelle).
  // StaffGuard : le bouton est aussi sur le Registre d'Académie (Admin).
  @UseGuards(StaffGuard)
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
}
