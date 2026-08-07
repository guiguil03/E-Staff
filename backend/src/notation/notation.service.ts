import * as path from "path";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage.service";
import { GradeNotationDto } from "./dto/grade-notation.dto";

// Matricules de démo générés en série (ETF-2026-0001..0030) suivant
// exactement le même index que components/compte-formateur/exampleData.ts
// et prisma/seed.ts (id frontend "apprenant-N" ↔ matricule ETF-2026-000N) —
// c'est ce qui permet au frontend de retrouver le bon Apprenant réel sans
// appel réseau supplémentaire. Documenté ici pour que le lien ne soit pas
// une coïncidence silencieuse.

function parseGridData(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

@Injectable()
export class NotationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  private async findGroupeOrThrow(groupeCle: string) {
    const groupe = await this.prisma.groupe.findUnique({ where: { cle: groupeCle } });
    if (!groupe) throw new NotFoundException(`Groupe ${groupeCle} introuvable.`);
    return groupe;
  }

  private async findSeanceOrThrow(groupeCle: string, numero: number) {
    const groupe = await this.findGroupeOrThrow(groupeCle);
    const seance = await this.prisma.seance.findUnique({
      where: { groupeId_numero: { groupeId: groupe.id, numero } },
    });
    if (!seance) throw new NotFoundException(`Séance n°${numero} introuvable pour le groupe ${groupeCle}.`);
    return seance;
  }

  private async findApprenantOrThrow(matricule: string) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant) throw new NotFoundException(`Apprenant ${matricule} introuvable.`);
    return apprenant;
  }

  private serialize(n: {
    id: string;
    competence: string;
    fileKey: string | null;
    fileName: string | null;
    soumisAt: Date | null;
    gridData: string | null;
    note: number | null;
    commentaires: string | null;
    scoreOn20: number | null;
    gradedAt: Date | null;
  }) {
    return {
      id: n.id,
      competence: n.competence,
      fileName: n.fileName,
      soumisAt: n.soumisAt,
      gridData: parseGridData(n.gridData),
      note: n.note,
      commentaires: n.commentaires,
      scoreOn20: n.scoreOn20,
      gradedAt: n.gradedAt,
    };
  }

  // ---- Formateur (Noter / Planning) --------------------------------------

  async getNotation(groupeCle: string, numero: number, apprenantMatricule: string, competence: string) {
    const seance = await this.findSeanceOrThrow(groupeCle, numero);
    const apprenant = await this.findApprenantOrThrow(apprenantMatricule);
    const notation = await this.prisma.notation.findUnique({
      where: { seanceId_apprenantId_competence: { seanceId: seance.id, apprenantId: apprenant.id, competence } },
    });
    return notation ? this.serialize(notation) : null;
  }

  async gradeNotation(
    groupeCle: string,
    numero: number,
    apprenantMatricule: string,
    competence: string,
    dto: GradeNotationDto
  ) {
    const seance = await this.findSeanceOrThrow(groupeCle, numero);
    const apprenant = await this.findApprenantOrThrow(apprenantMatricule);

    const gridDataStr = dto.gridData !== undefined ? JSON.stringify(dto.gridData) : undefined;
    const notation = await this.prisma.notation.upsert({
      where: { seanceId_apprenantId_competence: { seanceId: seance.id, apprenantId: apprenant.id, competence } },
      create: {
        seanceId: seance.id,
        apprenantId: apprenant.id,
        competence,
        gridData: gridDataStr,
        note: dto.note,
        commentaires: dto.commentaires,
        scoreOn20: dto.scoreOn20,
        gradedAt: new Date(),
      },
      update: {
        gridData: gridDataStr,
        note: dto.note,
        commentaires: dto.commentaires,
        scoreOn20: dto.scoreOn20,
        gradedAt: new Date(),
      },
    });
    return this.serialize(notation);
  }

  // Tableau récap Planning — toutes les notations de tous les apprenants du
  // groupe pour cette séance, clé par matricule.
  async listNotationsForSeance(groupeCle: string, numero: number) {
    const seance = await this.findSeanceOrThrow(groupeCle, numero);
    const notations = await this.prisma.notation.findMany({
      where: { seanceId: seance.id },
      include: { apprenant: true },
    });
    const parNotation: Record<string, Record<string, { scoreOn20: number | null }>> = {};
    for (const n of notations) {
      parNotation[n.apprenant.matricule] ??= {};
      parNotation[n.apprenant.matricule][n.competence] = { scoreOn20: n.scoreOn20 };
    }
    return parNotation;
  }

  // ---- Apprenant (lecture + dépôt) ----------------------------------------

  // Les 12 séances du groupe de l'apprenant + ses notations pour chacune —
  // alimente son tableau séances × compétences.
  async listApprenantNotations(matricule: string) {
    const apprenant = await this.findApprenantOrThrow(matricule);
    const seances = await this.prisma.seance.findMany({
      where: { groupeId: apprenant.groupeId },
      orderBy: { numero: "asc" },
      include: { notations: { where: { apprenantId: apprenant.id } } },
    });
    return seances.map((s) => ({
      numero: s.numero,
      startAt: s.startAt,
      notations: s.notations.map((n) => this.serialize(n)),
    }));
  }

  async getApprenantNotationDetail(matricule: string, numero: number, competence: string) {
    const apprenant = await this.findApprenantOrThrow(matricule);
    const seance = await this.prisma.seance.findUnique({
      where: { groupeId_numero: { groupeId: apprenant.groupeId, numero } },
    });
    if (!seance) throw new NotFoundException(`Séance n°${numero} introuvable.`);
    const notation = await this.prisma.notation.findUnique({
      where: { seanceId_apprenantId_competence: { seanceId: seance.id, apprenantId: apprenant.id, competence } },
    });
    return notation ? this.serialize(notation) : null;
  }

  // Dépôt de devoir — remet la notation à zéro si un devoir précédent avait
  // déjà été corrigé (redépôt après retour du formateur), même logique que
  // EvaluationService.saveSituationAudio.
  async uploadDevoir(matricule: string, numero: number, competence: string, file: Express.Multer.File) {
    const apprenant = await this.findApprenantOrThrow(matricule);
    const seance = await this.prisma.seance.findUnique({
      where: { groupeId_numero: { groupeId: apprenant.groupeId, numero } },
    });
    if (!seance) throw new NotFoundException(`Séance n°${numero} introuvable.`);

    const extension = path.extname(file.originalname) || "";
    const key = `devoirs/${apprenant.id}/${seance.id}-${competence}${extension}`;
    await this.storage.uploadBuffer(key, file.buffer, file.mimetype || "application/octet-stream");

    const notation = await this.prisma.notation.upsert({
      where: { seanceId_apprenantId_competence: { seanceId: seance.id, apprenantId: apprenant.id, competence } },
      create: {
        seanceId: seance.id,
        apprenantId: apprenant.id,
        competence,
        fileKey: key,
        fileName: file.originalname,
        soumisAt: new Date(),
      },
      update: {
        fileKey: key,
        fileName: file.originalname,
        soumisAt: new Date(),
        scoreOn20: null,
        gradedAt: null,
      },
    });
    return this.serialize(notation);
  }

  // ---- File d'attente "Évaluer & Corriger" --------------------------------

  async listACorriger() {
    const notations = await this.prisma.notation.findMany({
      where: { fileKey: { not: null }, gradedAt: null },
      include: { apprenant: true, seance: { include: { groupe: true } } },
      orderBy: { soumisAt: "asc" },
    });
    return notations.map((n) => ({
      id: n.id,
      apprenantMatricule: n.apprenant.matricule,
      apprenantPrenom: n.apprenant.prenom,
      apprenantNom: n.apprenant.nom,
      groupeCle: n.seance.groupe.cle,
      groupeLabel: n.seance.groupe.label,
      numero: n.seance.numero,
      competence: n.competence,
      fileName: n.fileName,
      soumisAt: n.soumisAt,
    }));
  }

  async getDevoirStream(notationId: string) {
    const notation = await this.prisma.notation.findUnique({ where: { id: notationId } });
    if (!notation?.fileKey) throw new NotFoundException("Devoir introuvable.");
    try {
      return await this.storage.getObjectStream(notation.fileKey);
    } catch {
      throw new NotFoundException("Fichier introuvable.");
    }
  }
}
