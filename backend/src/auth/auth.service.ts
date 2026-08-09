import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
const APP_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// Comptes Apprenant réels — chaque ligne Apprenant a désormais son propre
// mot de passe (hash bcrypt), généré à la confirmation de paiement (voir
// EvaluationService.confirmPayment) ou lors du seed (démo). Formateur/Admin
// restent sur le stopgap "un identifiant de test partagé" (AuthController)
// pour l'instant — pas urgent, petit nombre de personnes connues (voir
// brainstorm 2026-08-10).
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService
  ) {}

  async loginApprenant(matricule: string, password: string) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant || !apprenant.password) return null;

    const valid = await bcrypt.compare(password, apprenant.password);
    return valid ? apprenant : null;
  }

  async changePassword(dto: ChangePasswordDto) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { matricule: dto.matricule },
    });
    if (!apprenant || !apprenant.password) {
      throw new UnauthorizedException("Matricule ou mot de passe invalide.");
    }

    const valid = await bcrypt.compare(dto.oldPassword, apprenant.password);
    if (!valid) {
      throw new UnauthorizedException("Matricule ou mot de passe invalide.");
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.apprenant.update({
      where: { id: apprenant.id },
      data: { password: newHash },
    });

    return { ok: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { matricule: dto.matricule },
    });

    // Toujours répondre pareil, que le matricule existe ou non — évite de
    // laisser deviner quels matricules sont valides.
    if (apprenant) {
      const token = crypto.randomBytes(32).toString("hex");
      await this.prisma.apprenant.update({
        where: { id: apprenant.id },
        data: { resetToken: token, resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
      });

      const link = `${APP_URL}/reinitialiser-mot-de-passe?token=${token}`;
      await this.email.send({
        to: apprenant.email,
        subject: "Réinitialisation de votre mot de passe e-Staf",
        text: `Bonjour ${apprenant.prenom},\n\nUne demande de réinitialisation de mot de passe a été faite pour votre compte (${apprenant.matricule}).\n\nCliquez ici pour choisir un nouveau mot de passe (valable 1h) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.\n\nL'équipe e-Staf`,
      });
    }

    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { resetToken: dto.token },
    });
    if (!apprenant || !apprenant.resetTokenExpiresAt || apprenant.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException("Lien de réinitialisation invalide ou expiré.");
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.apprenant.update({
      where: { id: apprenant.id },
      data: { password: newHash, resetToken: null, resetTokenExpiresAt: null },
    });

    return { ok: true };
  }
}
