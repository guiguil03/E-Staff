import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import * as path from "path";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage.service";
import { EmailService } from "../common/email.service";
import { renderEmailHtml, emailParagraph, ctaButton } from "../common/email-template";

const APP_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// Supports de cours partagés par un formateur aux apprenants d'un groupe —
// voir SupportCours dans schema.prisma pour la distinction avec
// FormateurDocument (fiches de préparation, usage RH/perso uniquement).
@Injectable()
export class SupportCoursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly email: EmailService
  ) {}

  private async findFormateurOrThrow(matricule: string) {
    const formateur = await this.prisma.formateur.findUnique({ where: { matricule } });
    if (!formateur) throw new NotFoundException(`Formateur ${matricule} introuvable.`);
    return formateur;
  }

  private async findGroupeOwnedOrThrow(groupeCle: string, formateurId: string) {
    const groupe = await this.prisma.groupe.findUnique({ where: { cle: groupeCle } });
    if (!groupe) throw new NotFoundException(`Groupe ${groupeCle} introuvable.`);
    if (groupe.formateurId !== formateurId) {
      throw new ForbiddenException(`Vous n'encadrez pas le groupe ${groupeCle}.`);
    }
    return groupe;
  }

  // ---- Formateur ------------------------------------------------------------

  async uploadSupport(
    formateurMatricule: string,
    groupeCle: string,
    seanceNumero: number | null,
    file: Express.Multer.File
  ) {
    const formateur = await this.findFormateurOrThrow(formateurMatricule);
    const groupe = await this.findGroupeOwnedOrThrow(groupeCle, formateur.id);

    const extension = path.extname(file.originalname) || "";
    const key = `supports-cours/${groupe.id}/${Date.now()}${extension}`;
    await this.storage.uploadBuffer(key, file.buffer, file.mimetype || "application/octet-stream");

    const support = await this.prisma.supportCours.create({
      data: {
        formateurId: formateur.id,
        groupeId: groupe.id,
        seanceNumero,
        filename: file.originalname,
        storageKey: key,
        mimeType: file.mimetype || "application/octet-stream",
      },
    });

    const apprenants = await this.prisma.apprenant.findMany({ where: { groupeId: groupe.id } });
    const link = `${APP_URL}/compte/apprenant/supports-de-cours`;
    const contexte =
      seanceNumero !== null ? `pour la séance n°${seanceNumero}` : "pour votre groupe";
    await Promise.all(
      apprenants.map((a) =>
        this.email.send({
          to: a.email,
          subject: `Nouveau support de cours — ${groupe.label}`,
          text: `Bonjour ${a.prenom},\n\nVotre formateur vient de déposer un nouveau support de cours ${contexte} (${groupe.label}) : ${file.originalname}.\n\nRetrouvez-le ici :\n${link}\n\nÀ bientôt,\nL'équipe e-Staf`,
          html: renderEmailHtml({
            title: "Nouveau support de cours",
            preheader: `${groupe.label} — ${file.originalname}`,
            bodyHtml:
              emailParagraph(`Bonjour ${a.prenom},`) +
              emailParagraph(
                `Votre formateur vient de déposer un nouveau support de cours ${contexte} (<strong>${groupe.label}</strong>) : <strong>${file.originalname}</strong>.`
              ) +
              ctaButton("Voir les supports de cours", link),
          }),
        })
      )
    );

    return { ...support, groupeCle: groupe.cle };
  }

  async listSupportsForFormateur(formateurMatricule: string, groupeCle: string) {
    const formateur = await this.findFormateurOrThrow(formateurMatricule);
    const groupe = await this.findGroupeOwnedOrThrow(groupeCle, formateur.id);
    const supports = await this.prisma.supportCours.findMany({
      where: { groupeId: groupe.id },
      orderBy: [{ seanceNumero: "asc" }, { createdAt: "desc" }],
    });
    return supports.map((s) => ({ ...s, groupeCle: groupe.cle }));
  }

  async getSupportStreamForFormateur(formateurMatricule: string, id: string) {
    const formateur = await this.findFormateurOrThrow(formateurMatricule);
    const support = await this.prisma.supportCours.findUnique({ where: { id } });
    if (!support) throw new NotFoundException("Support de cours introuvable.");
    if (support.formateurId !== formateur.id) {
      const groupe = await this.prisma.groupe.findUnique({ where: { id: support.groupeId } });
      if (groupe?.formateurId !== formateur.id) {
        throw new ForbiddenException("Vous n'avez pas accès à ce support.");
      }
    }
    const { stream, contentType } = await this.storage.getObjectStream(support.storageKey);
    return { stream, contentType: contentType ?? support.mimeType, filename: support.filename };
  }

  async deleteSupport(formateurMatricule: string, id: string) {
    const formateur = await this.findFormateurOrThrow(formateurMatricule);
    const support = await this.prisma.supportCours.findUnique({ where: { id } });
    if (!support) throw new NotFoundException("Support de cours introuvable.");
    const groupe = await this.prisma.groupe.findUnique({ where: { id: support.groupeId } });
    if (groupe?.formateurId !== formateur.id) {
      throw new ForbiddenException("Vous n'avez pas accès à ce support.");
    }
    await this.storage.deleteObject(support.storageKey);
    await this.prisma.supportCours.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Apprenant (pas de guard — même niveau de protection stopgap que le
  // reste du Compte Apprenant, matricule comme identifiant) ------------------

  private async findApprenantOrThrow(matricule: string) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant) throw new NotFoundException(`Apprenant ${matricule} introuvable.`);
    return apprenant;
  }

  async listSupportsForApprenant(matricule: string) {
    const apprenant = await this.findApprenantOrThrow(matricule);
    const supports = await this.prisma.supportCours.findMany({
      where: { groupeId: apprenant.groupeId },
      orderBy: [{ seanceNumero: "asc" }, { createdAt: "desc" }],
    });
    return supports.map(({ storageKey: _storageKey, ...rest }) => rest);
  }

  async getSupportStreamForApprenant(matricule: string, id: string) {
    const apprenant = await this.findApprenantOrThrow(matricule);
    const support = await this.prisma.supportCours.findUnique({ where: { id } });
    if (!support || support.groupeId !== apprenant.groupeId) {
      throw new NotFoundException("Support de cours introuvable.");
    }
    const { stream, contentType } = await this.storage.getObjectStream(support.storageKey);
    return { stream, contentType: contentType ?? support.mimeType, filename: support.filename };
  }
}
