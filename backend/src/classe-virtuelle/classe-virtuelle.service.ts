import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DailyService } from "./daily.service";
import { EmailService } from "../common/email.service";
import { UpsertSeanceDto } from "./dto/upsert-seance.dto";

// Le lien de la salle n'est jamais renvoyé en dehors de cette fenêtre —
// c'est le backend qui garde le contrôle du "rejoin", pas juste l'UI.
const JOIN_WINDOW_BEFORE_MINUTES = 10;
const APP_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

function formatDateTime(date: Date): string {
  return date.toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Indian/Antananarivo",
  });
}

export interface RoomStatus {
  groupeCle: string;
  numero: number;
  startAt: Date | null;
  dureeMinutes: number;
  withinJoinWindow: boolean;
  configured: boolean;
  roomUrl: string | null;
}

@Injectable()
export class ClasseVirtuelleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly daily: DailyService,
    private readonly email: EmailService
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

  async getSeance(groupeCle: string, numero: number) {
    const seance = await this.findSeanceOrThrow(groupeCle, numero);
    return { ...seance, groupeCle };
  }

  async upsertSeance(groupeCle: string, numero: number, dto: UpsertSeanceDto) {
    const seance = await this.findSeanceOrThrow(groupeCle, numero);

    const nextStartAt = dto.startAt !== undefined ? new Date(dto.startAt) : seance.startAt;
    const dureeMinutes = dto.dureeMinutes ?? seance.dureeMinutes;
    const startAtChanged =
      nextStartAt?.getTime() !== seance.startAt?.getTime() && nextStartAt !== null;

    let dailyRoomName = seance.dailyRoomName;
    let dailyRoomUrl = seance.dailyRoomUrl;

    // Crée la salle Daily la première fois qu'un horaire est renseigné.
    if (nextStartAt && !seance.dailyRoomName) {
      const expUnixSeconds = Math.floor(nextStartAt.getTime() / 1000) + dureeMinutes * 60 + 15 * 60;
      const room = await this.daily.createRoom(seance.id, expUnixSeconds);
      if (room.roomName) {
        dailyRoomName = room.roomName;
        dailyRoomUrl = room.roomUrl ?? null;
      }
    }

    const updated = await this.prisma.seance.update({
      where: { id: seance.id },
      data: {
        startAt: nextStartAt,
        dureeMinutes,
        objectifs: dto.objectifs ?? seance.objectifs,
        dailyRoomName,
        dailyRoomUrl,
      },
    });

    // Alerte immédiate dès qu'un horaire nouveau ou modifié est enregistré —
    // distincte des rappels J-1/15min du cron (ClasseVirtuelleReminderService),
    // qui restent basés sur l'échéance et pas sur l'action de planification.
    if (startAtChanged && nextStartAt) {
      const groupe = await this.prisma.groupe.findUnique({
        where: { cle: groupeCle },
        include: { apprenants: true },
      });
      const link = `${APP_URL}/compte/apprenant/classe-virtuelle`;
      for (const apprenant of groupe?.apprenants ?? []) {
        await this.email.send({
          to: apprenant.email,
          subject: `Nouvelle séance programmée — ${groupe!.label}`,
          text: `Bonjour ${apprenant.prenom},\n\nUne séance vient d'être programmée pour ${groupe!.label} : ${formatDateTime(nextStartAt)}.\n\nVous recevrez un rappel la veille et 15 minutes avant le début. Vous pourrez rejoindre la classe virtuelle ici :\n${link}\n\nÀ bientôt,\nL'équipe e-Staf`,
        });
      }
    }

    return { ...updated, groupeCle };
  }

  // Mint un jeton nominatif quand un utilisateur identifié est fourni (pour
  // que les webhooks de présence puissent le rattacher) ; retombe sur l'URL
  // de salle nue si pas d'utilisateur fourni ou si le fournisseur n'est pas
  // configuré.
  private async computeRoomStatus(
    groupeCle: string,
    numero: number,
    startAt: Date | null,
    dureeMinutes: number,
    dailyRoomName: string | null,
    dailyRoomUrl: string | null,
    joiner?: { userId: string; userName: string; isOwner: boolean }
  ): Promise<RoomStatus> {
    const configured = Boolean(process.env.DAILY_API_KEY);
    const now = Date.now();
    let withinJoinWindow = false;
    if (startAt) {
      const opensAt = startAt.getTime() - JOIN_WINDOW_BEFORE_MINUTES * 60 * 1000;
      const closesAt = startAt.getTime() + dureeMinutes * 60 * 1000;
      withinJoinWindow = now >= opensAt && now <= closesAt;
    }

    let roomUrl: string | null = withinJoinWindow && dailyRoomName ? dailyRoomUrl : null;
    if (roomUrl && dailyRoomName && joiner) {
      const token = await this.daily.mintMeetingToken({
        roomName: dailyRoomName,
        userId: joiner.userId,
        userName: joiner.userName,
        isOwner: joiner.isOwner,
      });
      if (token) roomUrl = `${roomUrl}?t=${token}`;
    }

    return {
      groupeCle,
      numero,
      startAt,
      dureeMinutes,
      withinJoinWindow,
      configured,
      roomUrl,
    };
  }

  async getSeanceRoom(groupeCle: string, numero: number, formateurMatricule?: string): Promise<RoomStatus> {
    const seance = await this.findSeanceOrThrow(groupeCle, numero);
    const formateur = formateurMatricule
      ? await this.prisma.formateur.findUnique({ where: { matricule: formateurMatricule } })
      : null;
    return this.computeRoomStatus(
      groupeCle,
      numero,
      seance.startAt,
      seance.dureeMinutes,
      seance.dailyRoomName,
      seance.dailyRoomUrl,
      formateur ? { userId: formateur.id, userName: `${formateur.prenom} ${formateur.nom}`, isOwner: true } : undefined
    );
  }

  // Ordre par startAt croissant, puis premier résultat dont la séance n'est
  // pas encore terminée — pas juste "le plus proche dans le temps", car une
  // séance passée non-nettoyée ne doit jamais masquer une séance future
  // programmée après elle. Volumes petits (12 séances/groupe), filtrage en
  // mémoire plutôt qu'en SQL.
  private firstOngoingOrUpcoming<T extends { startAt: Date | null; dureeMinutes: number }>(
    seances: T[]
  ): T | undefined {
    const now = Date.now();
    return seances
      .filter((s) => s.startAt !== null)
      .sort((a, b) => a.startAt!.getTime() - b.startAt!.getTime())
      .find((s) => s.startAt!.getTime() + s.dureeMinutes * 60 * 1000 >= now);
  }

  async getFormateurProchaineSeance() {
    const seances = await this.prisma.seance.findMany({
      where: { startAt: { not: null } },
      include: { groupe: true },
    });
    const seance = this.firstOngoingOrUpcoming(seances);
    if (!seance || !seance.startAt) return null;
    return { groupeCle: seance.groupe.cle, numero: seance.numero, startAt: seance.startAt };
  }

  // Toutes les séances planifiées (tous groupes) — alimente le calendrier
  // formateur. Pas de fenêtre de rejoin ici, juste l'horaire pour affichage.
  async listSeances() {
    const seances = await this.prisma.seance.findMany({
      where: { startAt: { not: null } },
      include: { groupe: true },
      orderBy: { startAt: "asc" },
    });
    return seances.map((s) => ({
      groupeCle: s.groupe.cle,
      groupeLabel: s.groupe.label,
      numero: s.numero,
      startAt: s.startAt,
      dureeMinutes: s.dureeMinutes,
      objectifs: s.objectifs,
    }));
  }

  // Séances planifiées du groupe d'un apprenant — alimente son calendrier.
  async listApprenantSeances(matricule: string) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { matricule },
      include: { groupe: true },
    });
    if (!apprenant) return [];

    const seances = await this.prisma.seance.findMany({
      where: { groupeId: apprenant.groupeId, startAt: { not: null } },
      orderBy: { startAt: "asc" },
    });
    return seances.map((s) => ({
      groupeCle: apprenant.groupe.cle,
      groupeLabel: apprenant.groupe.label,
      numero: s.numero,
      startAt: s.startAt,
      dureeMinutes: s.dureeMinutes,
      objectifs: s.objectifs,
    }));
  }

  // Historique des séances passées d'un groupe — horaire, rappels envoyés,
  // présence (table Presence, alimentée par les webhooks Daily). La
  // moyenne/objectifs de notation détaillée reste côté frontend
  // (planningGradesStore, non persistée) — pas incluse ici.
  async getHistorique(groupeCle: string) {
    const groupe = await this.findGroupeOrThrow(groupeCle);
    const now = new Date();
    const seances = await this.prisma.seance.findMany({
      where: { groupeId: groupe.id, startAt: { not: null, lt: now } },
      orderBy: { startAt: "desc" },
      include: {
        presences: {
          include: { apprenant: true },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    return seances.map((s) => ({
      numero: s.numero,
      startAt: s.startAt,
      dureeMinutes: s.dureeMinutes,
      objectifs: s.objectifs,
      rappelJ1Envoye: s.rappelJ1EnvoyeAt !== null,
      rappel15minEnvoye: s.rappel15minEnvoyeAt !== null,
      presences: s.presences.map((p) => ({
        apprenantId: p.apprenantId,
        prenom: p.apprenant?.prenom ?? null,
        nom: p.apprenant?.nom ?? null,
        role: p.role,
        displayName: p.displayName,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        dureeSecondes: p.dureeSecondes,
      })),
    }));
  }

  async getApprenantProchaineSeanceRoom(matricule: string): Promise<RoomStatus | null> {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { matricule },
      include: { groupe: true },
    });
    if (!apprenant) return null;

    const seances = await this.prisma.seance.findMany({
      where: { groupeId: apprenant.groupeId, startAt: { not: null } },
    });
    const seance = this.firstOngoingOrUpcoming(seances);
    if (!seance || !seance.startAt) return null;

    return this.computeRoomStatus(
      apprenant.groupe.cle,
      seance.numero,
      seance.startAt,
      seance.dureeMinutes,
      seance.dailyRoomName,
      seance.dailyRoomUrl,
      { userId: apprenant.id, userName: `${apprenant.prenom} ${apprenant.nom}`, isOwner: false }
    );
  }
}
