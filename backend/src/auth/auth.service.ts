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
import { escapeHtml, renderEmailHtml, emailParagraph, ctaButton } from "../common/email-template";
import { createViewAsToken } from "../common/view-as-token";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
const APP_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// Un « compte » est un Apprenant, un Formateur, un Agent de production
// (2026-10-22) ou un compte nominatif Admin/RH (CompteStaff, audit du
// 2026-09-28). Les quatre modèles ont les mêmes champs d'auth (password,
// resetToken, resetTokenExpiresAt, sessionsRevoqueesAt) et des matricules
// qui ne se chevauchent pas ("ETF-2026-", "ETF-FORM-2026-", "ETF-AG-2026-",
// "ADM-"/"RH-") — d'où une recherche de compte commune (findAccount), qui
// fait marcher « mot de passe oublié » et « déconnecter partout » pour tous
// sans code dédié par rôle.
type TypeCompte = "apprenant" | "formateur" | "agent" | "superviseur" | "staff";
type Account = {
  type: TypeCompte;
  id: string;
  matricule: string;
  prenom: string;
  email: string;
  password: string | null;
  resetTokenExpiresAt: Date | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService
  ) {}

  private async findAccount(
    where: { matricule: string } | { resetToken: string }
  ): Promise<Account | null> {
    const apprenant = await this.prisma.apprenant.findUnique({ where });
    if (apprenant) return { ...apprenant, type: "apprenant" };
    const formateur = await this.prisma.formateur.findUnique({ where });
    if (formateur) return { ...formateur, type: "formateur" };
    const agent = await this.prisma.agent.findUnique({ where });
    if (agent) return { ...agent, type: "agent" };
    // Les identifiants du superviseur vivent dans CompteSuperviseur ; `id`
    // est celui du compte (cible de updateAccountPassword).
    const compte = await this.prisma.compteSuperviseur.findFirst({
      where: "resetToken" in where ? { resetToken: where.resetToken } : { superviseur: { matricule: where.matricule } },
      include: { superviseur: true },
    });
    if (compte) {
      return {
        type: "superviseur",
        id: compte.id,
        matricule: compte.superviseur.matricule,
        prenom: compte.superviseur.prenom,
        email: compte.superviseur.email,
        password: compte.password,
        resetTokenExpiresAt: compte.resetTokenExpiresAt,
      };
    }
    const staff = await this.prisma.compteStaff.findUnique({ where });
    if (staff && staff.actif) return { ...staff, type: "staff" };
    return null;
  }

  private findAccountByMatricule(matricule: string) {
    return this.findAccount({ matricule });
  }

  private findAccountByResetToken(token: string) {
    return this.findAccount({ resetToken: token });
  }

  private updateAccountPassword(account: Account, data: Record<string, unknown>) {
    if (account.type === "formateur") return this.prisma.formateur.update({ where: { id: account.id }, data });
    if (account.type === "agent") return this.prisma.agent.update({ where: { id: account.id }, data });
    if (account.type === "superviseur") return this.prisma.compteSuperviseur.update({ where: { id: account.id }, data });
    if (account.type === "staff") return this.prisma.compteStaff.update({ where: { id: account.id }, data });
    return this.prisma.apprenant.update({ where: { id: account.id }, data });
  }

  async compteExiste(matricule: string) {
    return (await this.findAccountByMatricule(matricule)) !== null;
  }

  // Coupe toutes les sessions du compte émises jusqu'ici (voir
  // common/session.ts, sessionToujoursValide).
  async revoquerSessions(matricule: string) {
    const account = await this.findAccountByMatricule(matricule);
    if (!account) throw new NotFoundException("Compte introuvable.");
    await this.updateAccountPassword(account, { sessionsRevoqueesAt: new Date() });
    return { ok: true };
  }

  async loginStaff(matricule: string, password: string) {
    const compte = await this.prisma.compteStaff.findUnique({ where: { matricule } });
    if (!compte || !compte.actif) return null;
    const valid = await bcrypt.compare(password, compte.password);
    return valid ? compte : null;
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

  // Un agent "inactif" (fin de contrat) ne peut plus se connecter — son
  // compte reste en base pour l'historique (missions, paie), voir
  // Agent.statut et sessionToujoursValide.
  async loginAgent(matricule: string, password: string) {
    const agent = await this.prisma.agent.findUnique({ where: { matricule } });
    if (!agent || !agent.password || agent.statut === "inactif") return null;

    const valid = await bcrypt.compare(password, agent.password);
    return valid ? agent : null;
  }

  // Superviseur (espace du 2026-10-28) : sans mot de passe, pas de connexion
  // (compte non encore activé par la RH).
  async loginSuperviseur(matricule: string, password: string) {
    const compte = await this.prisma.compteSuperviseur.findFirst({
      where: { superviseur: { matricule } },
      include: { superviseur: true },
    });
    if (!compte) return null;

    const valid = await bcrypt.compare(password, compte.password);
    return valid ? compte.superviseur : null;
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
    // Déconnecte toutes les sessions existantes (audit du 2026-09-28).
    await this.updateAccountPassword(account, { password: newHash, sessionsRevoqueesAt: new Date() });

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
        html: renderEmailHtml({
          title: "Réinitialisation de mot de passe",
          preheader: "Choisissez un nouveau mot de passe (lien valable 1h)",
          bodyHtml:
            emailParagraph(`Bonjour ${escapeHtml(account.prenom)},`) +
            emailParagraph(
              `Une demande de réinitialisation de mot de passe a été faite pour votre compte (${account.matricule}).`
            ) +
            ctaButton("Choisir un nouveau mot de passe", link) +
            emailParagraph(
              "Ce lien est valable 1h. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail."
            ),
        }),
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
      sessionsRevoqueesAt: new Date(),
    });

    return { ok: true };
  }

  // "Se connecter en tant que" — la RH consulte déjà le Casier Apprenant en
  // lecture seule (RhService.getApprenantCasier) ; ce jeton permet en plus
  // d'ouvrir le vrai tableau de bord de l'apprenant tel qu'il le voit, sans
  // connaître ni transmettre son mot de passe. Voir createFormateurViewAsToken
  // ci-dessous pour l'équivalent formateur.
  async createApprenantViewAsToken(matricule: string) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant) throw new NotFoundException("Apprenant introuvable.");
    return { token: createViewAsToken(matricule, "apprenant") };
  }

  // Équivalent agent de production — la RH consulte son casier côté
  // Production (AgentsService.getAgentCasier) ; ce jeton ouvre son espace
  // tel que l'agent le voit (performances, temps travaillé, paie), sans
  // connaître son mot de passe. Un agent "inactif" n'est pas ouvrable : ce
  // serait une session que lui-même ne peut plus obtenir.
  async createAgentViewAsToken(matricule: string) {
    const agent = await this.prisma.agent.findUnique({ where: { matricule } });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    if (agent.statut === "inactif") {
      throw new BadRequestException("Cet agent est inactif : son espace n'est plus accessible.");
    }
    return { token: createViewAsToken(matricule, "agent") };
  }

  // Équivalent superviseur — la RH ouvre son espace tel qu'il le voit. Sans
  // compte d'accès (CompteSuperviseur), il n'y a rien à ouvrir : même règle
  // que pour un agent inactif.
  async createSuperviseurViewAsToken(matricule: string) {
    const compte = await this.prisma.compteSuperviseur.findFirst({
      where: { superviseur: { matricule } },
      select: { id: true },
    });
    if (!compte) {
      throw new BadRequestException("Ce superviseur n'a pas encore d'accès : envoyez-lui ses identifiants d'abord.");
    }
    return { token: createViewAsToken(matricule, "superviseur") };
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
