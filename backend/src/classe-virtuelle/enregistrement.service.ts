import { ForbiddenException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DailyService } from "./daily.service";

// Charge utile Daily de l'événement recording.ready-to-download (champs
// utilisés ici uniquement).
export interface RecordingReadyPayload {
  recording_id: string;
  room_name: string;
  start_ts?: number;
  duration?: number;
}

// Enregistrements cloud des classes virtuelles, revisionnables par les
// apprenants du groupe (demande cliente du 2026-09-25). La vidéo reste
// stockée chez Daily : on ne garde que son identifiant, et chaque lecture
// demande un lien d'accès temporaire, après vérification des droits.
@Injectable()
export class EnregistrementService {
  private readonly logger = new Logger(EnregistrementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly daily: DailyService
  ) {}

  // Webhook recording.ready-to-download — le nom de salle Daily est l'id de
  // la séance (voir ClasseVirtuelleService / DailyService.createRoom).
  // Idempotent : Daily peut renvoyer le même événement.
  async enregistrerPret(payload: RecordingReadyPayload) {
    const seance = await this.prisma.seance.findUnique({ where: { id: payload.room_name } });
    if (!seance) {
      // Salle sans séance (ex. Live du Forum) : rien à rattacher.
      this.logger.warn(`Enregistrement ${payload.recording_id} pour une salle inconnue (${payload.room_name})`);
      return;
    }
    await this.prisma.enregistrement.upsert({
      where: { dailyRecordingId: payload.recording_id },
      update: {},
      create: {
        seanceId: seance.id,
        dailyRecordingId: payload.recording_id,
        dureeSecondes: payload.duration ? Math.round(payload.duration) : null,
        debutAt: payload.start_ts ? new Date(payload.start_ts * 1000) : null,
      },
    });
  }

  private serialize(e: { id: string; dureeSecondes: number | null; debutAt: Date | null; createdAt: Date }) {
    return { id: e.id, dureeSecondes: e.dureeSecondes, debutAt: e.debutAt ?? e.createdAt };
  }

  // ---- Apprenant ------------------------------------------------------------

  // Séances de son groupe ayant au moins un enregistrement, par numéro.
  async listPourApprenant(matricule: string) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant) throw new NotFoundException("Apprenant introuvable.");
    const enregistrements = await this.prisma.enregistrement.findMany({
      where: { seance: { groupeId: apprenant.groupeId } },
      include: { seance: true },
      orderBy: { createdAt: "asc" },
    });
    return enregistrements.map((e) => ({ ...this.serialize(e), numero: e.seance.numero }));
  }

  async lienPourApprenant(matricule: string, enregistrementId: string) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    const enregistrement = await this.prisma.enregistrement.findUnique({
      where: { id: enregistrementId },
      include: { seance: true },
    });
    if (!apprenant || !enregistrement || enregistrement.seance.groupeId !== apprenant.groupeId) {
      throw new NotFoundException("Enregistrement introuvable.");
    }
    return this.lien(enregistrement.dailyRecordingId);
  }

  // ---- Formateur ------------------------------------------------------------

  private async groupeDuFormateurOrThrow(groupeCle: string, formateurMatricule: string) {
    const [groupe, formateur] = await Promise.all([
      this.prisma.groupe.findUnique({ where: { cle: groupeCle } }),
      this.prisma.formateur.findUnique({ where: { matricule: formateurMatricule } }),
    ]);
    if (!groupe) throw new NotFoundException(`Groupe ${groupeCle} introuvable.`);
    if (!formateur || groupe.formateurId !== formateur.id) {
      throw new ForbiddenException(`Vous n'encadrez pas le groupe ${groupeCle}.`);
    }
    return groupe;
  }

  async listPourFormateur(groupeCle: string, numero: number, formateurMatricule: string) {
    const groupe = await this.groupeDuFormateurOrThrow(groupeCle, formateurMatricule);
    const enregistrements = await this.prisma.enregistrement.findMany({
      where: { seance: { groupeId: groupe.id, numero } },
      orderBy: { createdAt: "asc" },
    });
    return enregistrements.map((e) => this.serialize(e));
  }

  async lienPourFormateur(enregistrementId: string, formateurMatricule: string) {
    const enregistrement = await this.prisma.enregistrement.findUnique({
      where: { id: enregistrementId },
      include: { seance: { include: { groupe: true } } },
    });
    if (!enregistrement) throw new NotFoundException("Enregistrement introuvable.");
    await this.groupeDuFormateurOrThrow(enregistrement.seance.groupe.cle, formateurMatricule);
    return this.lien(enregistrement.dailyRecordingId);
  }

  private async lien(dailyRecordingId: string) {
    const lien = await this.daily.getRecordingAccessLink(dailyRecordingId);
    if (!lien) throw new ServiceUnavailableException("Enregistrement momentanément indisponible — réessayez.");
    return lien;
  }
}
