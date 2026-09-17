import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { createViewAsToken } from "../common/view-as-token";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
const APP_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// Un "compte" ici est soit un Apprenant, soit un Formateur (Admin reste sur
// le stopgap "identifiant de test partagé", pas de compte individuel — voir
// AuthController). Les deux modèles ont les mêmes champs d'auth
// (password/resetToken/resetTokenExpiresAt, voir migrations apprenant_auth
// et formateur_auth) et leurs matricules ne se chevauchent jamais
// ("ETF-2026-" vs "ETF-FORM-2026-"), donc un simple essai
// apprenant-puis-formateur suffit à retrouver le bon compte par matricule.
type Account = {
  id: string;
  matricule: string;
  prenom: string;
  email: string;
  password: string | null;
  resetTokenExpiresAt: Date | null;
};

// Comptes réels — chaque ligne Apprenant/Formateur a son propre mot de passe
// (hash bcrypt), généré à la création (confirmation de paiement pour
// l'apprenant, RhService.createFormateur pour le formateur) ou lors du seed
// (démo). Admin reste sur le stopgap "un identifiant de test partagé"
// (AuthController) — pas urgent, une seule personne (voir brainstorm
// 2026-08-10).
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService
  ) {}

  private async findAccountByMatricule(matricule: string): Promise<Account | null> {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (apprenant) return apprenant;
    return this.prisma.formateur.findUnique({ where: { matricule } });
  }

  private async findAccountByResetToken(token: string): Promise<Account | null> {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { resetToken: token } });
    if (apprenant) return apprenant;
    return this.prisma.formateur.findUnique({ where: { resetToken: token } });
  }

  private updateAccountPassword(account: Account, data: Record<string, unknown>) {
    // Un même matricule n'existe jamais dans les deux tables à la fois (voir
    // commentaire au-dessus) — l'id suffit à retrouver la bonne ligne une
    // fois qu'on sait de quel modèle elle vient.
    return account.matricule.startsWith("ETF-FORM-")
      ? this.prisma.formateur.update({ where: { id: account.id }, data })
      : this.prisma.apprenant.update({ where: { id: account.id }, data });
  }

  async loginApprenant(matricule: string, password: string) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant || !apprenant.password) return null;

    const valid = await bcrypt.compare(password, apprenant.password);
    return valid ? apprenant : null;
  }

  async loginFormateur(matricule: string, password: string) {
    const formateur = await this.prisma.formateur.findUnique({ where: { matricule } });
    if (!formateur || !formateur.password) return null;

    const valid = await bcrypt.compare(password, formateur.password);
    return valid ? formateur : null;
  }

  async changePassword(dto: ChangePasswordDto) {
    const account = await this.findAccountByMatricule(dto.matricule);
    if (!account || !account.password) {
      throw new UnauthorizedException("Matricule ou mot de passe invalide.");
    }

    const valid = await bcrypt.compare(dto.oldPassword, account.password);
    if (!valid) {
      throw new UnauthorizedException("Matricule ou mot de passe invalide.");
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.updateAccountPassword(account, { password: newHash });

    return { ok: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const account = await this.findAccountByMatricule(dto.matricule);

    // Toujours répondre pareil, que le matricule existe ou non — évite de
    // laisser deviner quels matricules sont valides.
    if (account) {
      const token = crypto.randomBytes(32).toString("hex");
      await this.updateAccountPassword(account, {
        resetToken: token,
        resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      });

      const link = `${APP_URL}/reinitialiser-mot-de-passe?token=${token}`;
      await this.email.send({
        to: account.email,
        subject: "Réinitialisation de votre mot de passe e-Staf",
        text: `Bonjour ${account.prenom},\n\nUne demande de réinitialisation de mot de passe a été faite pour votre compte (${account.matricule}).\n\nCliquez ici pour choisir un nouveau mot de passe (valable 1h) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.\n\nL'équipe e-Staf`,
      });
    }

    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const account = await this.findAccountByResetToken(dto.token);
    if (!account || !account.resetTokenExpiresAt || account.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException("Lien de réinitialisation invalide ou expiré.");
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.updateAccountPassword(account, {
      password: newHash,
      resetToken: null,
      resetTokenExpiresAt: null,
    });

    return { ok: true };
  }

  // "Se connecter en tant que" — la RH consulte déjà le Casier Apprenant en
  // lecture seule (RhService.getApprenantCasier) ; ce jeton permet en plus
  // d'ouvrir le vrai tableau de bord de l'apprenant tel qu'il le voit, sans
  // connaître ni transmettre son mot de passe. Pas d'équivalent formateur
  // pour l'instant (pas demandé) — les formateurs ont bien des comptes
  // individuels depuis la migration formateur_auth, seul ce raccourci RH
  // manque encore.
  async createApprenantViewAsToken(matricule: string) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant) throw new NotFoundException("Apprenant introuvable.");
    return { token: createViewAsToken(matricule, "apprenant") };
  }
}
