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

// Comptes Apprenant ET Formateur réels — chaque ligne a son propre mot de
// passe (hash bcrypt), généré par la RH à la création du compte (voir
// EvaluationService.confirmPayment pour l'apprenant, RhService.createFormateur
// pour le formateur) et envoyé une seule fois en clair par e-mail. Admin
// reste sur le stopgap "identifiant de test partagé" (AuthController) —
// une seule personne concernée, pas encore de besoin de comptes individuels.
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

  async loginFormateur(matricule: string, password: string) {
    const formateur = await this.prisma.formateur.findUnique({ where: { matricule } });
    if (!formateur || !formateur.password) return null;

    const valid = await bcrypt.compare(password, formateur.password);
    return valid ? formateur : null;
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

  // "Se connecter en tant que" — la RH consulte déjà les Casiers Apprenant/
  // Formateur en lecture seule ; ce jeton permet en plus d'ouvrir le vrai
  // tableau de bord tel que la personne le voit, sans connaître ni
  // transmettre son mot de passe (voir AuthController.consumeViewAs).
  async createApprenantViewAsToken(matricule: string) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant) throw new NotFoundException("Apprenant introuvable.");
    return { token: createViewAsToken(matricule, "apprenant") };
  }

  // Équivalent formateur — n'a de sens réel que depuis que chaque formateur
  // a son propre compte (voir RhService.createFormateur) : le Cockpit
  // Formateur est désormais filtré par formateurId (voir CockpitService,
  // NotationService, ClasseVirtuelleService), donc "se connecter en tant
  // que" ouvre bien SA vue (ses groupes, sa file de correction), pas la vue
  // partagée d'avant.
  async createFormateurViewAsToken(matricule: string) {
    const formateur = await this.prisma.formateur.findUnique({ where: { matricule } });
    if (!formateur) throw new NotFoundException("Formateur introuvable.");
    return { token: createViewAsToken(matricule, "formateur") };
  }
}
