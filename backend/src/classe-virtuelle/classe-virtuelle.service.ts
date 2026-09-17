import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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
  objectifs: string | null;
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

  // Annule la planification d'une séance : réinitialise l'horaire et
  // supprime la salle Daily associée (le créneau numéro reste, réutilisable
  // pour une nouvelle planification plus tard) — pas une suppression du
  // Seance lui-même, qui représente le créneau structurel du groupe.
  async cancelSeance(groupeCle: string, numero: number) {
    const seance = await this.findSeanceOrThrow(groupeCle, numero);

    // Ne jamais couper une classe virtuelle en cours par erreur.
    if (seance.startAt) {
      const opensAt = seance.startAt.getTime() - JOIN_WINDOW_BEFORE_MINUTES * 60 * 1000;
      const closesAt = seance.startAt.getTime() + seance.dureeMinutes * 60 * 1000;
      const now = Date.now();
      if (now >= opensAt && now <= closesAt) {
        throw new BadRequestException(
          "Cette séance est en cours (fenêtre de rejoin ouverte) — impossible de l'annuler maintenant."
        );
      }
    }

    if (seance.dailyRoomName) {
      await this.daily.deleteRoom(seance.dailyRoomName);
    }

    const wasScheduled = seance.startAt;
    const updated = await this.prisma.seance.update({
      where: { id: seance.id },
      data: {
        startAt: null,
        objectifs: null,
        dailyRoomName: null,
        dailyRoomUrl: null,
        rappelJ1EnvoyeAt: null,
        rappel15minEnvoyeAt: null,
      },
    });

    // Prévient les apprenants qu'une séance qu'ils attendaient est annulée
    // — même logique que l'alerte de planification, sens inverse.
    if (wasScheduled) {
      const groupe = await this.prisma.groupe.findUnique({
        where: { cle: groupeCle },
        include: { apprenants: true },
      });
      for (const apprenant of groupe?.apprenants ?? []) {
        await this.email.send({
          to: apprenant.email,
          subject: `Séance annulée — ${groupe!.label}`,
          text: `Bonjour ${apprenant.prenom},\n\nLa séance qui était programmée pour ${groupe!.label} le ${formatDateTime(wasScheduled)} a été annulée par votre formateur.\n\nVous serez prévenu(e) dès qu'une nouvelle date sera fixée.\n\nÀ bientôt,\nL'équipe e-Staf`,
        });
      }
    }

    return { ...updated, groupeCle };
  }

  async upsertSeance(groupeCle: string, numero: number, dto: UpsertSeanceDto) {
    const groupe = await this.findGroupeOrThrow(groupeCle);
    const seance = await this.findSeanceOrThrow(groupeCle, numero);

    const nextStartAt = dto.startAt !== undefined ? new Date(dto.startAt) : seance.startAt;
    const dureeMinutes = dto.dureeMinutes ?? seance.dureeMinutes;
    const startAtChanged =
      nextStartAt?.getTime() !== seance.startAt?.getTime() && nextStartAt !== null;
    const dureeChanged = dto.dureeMinutes !== undefined && dto.dureeMinutes !== seance.dureeMinutes;

    if (startAtChanged && nextStartAt && nextStartAt.getTime() < Date.now()) {
      throw new BadRequestException("Impossible de planifier une séance dans le passé.");
    }

    // Un seul formateur ne peut pas être sur deux classes virtuelles à la
    // fois — bloque le chevauchement avec n'importe quelle autre séance déjà
    // planifiée pour CE MÊME formateur (groupe.formateurId), pas tous les
    // groupes confondus : deux groupes différents, chacun avec son propre
    // formateur assigné (voir RhService.assignFormateur), peuvent très bien
    // avoir une classe virtuelle en même temps. Si le groupe n'a pas encore
    // de formateur assigné, aucun chevauchement n'est vérifiable, donc on ne
    // bloque pas (bug relevé le 2026-09-17 : la vérification comparait à
    // tort contre toutes les séances de tous les groupes).
    if ((startAtChanged || dureeChanged) && groupe.formateurId) {
      const nextEnd = nextStartAt!.getTime() + dureeMinutes * 60 * 1000;
      const autres = await this.prisma.seance.findMany({
        where: {
          startAt: { not: null },
          id: { not: seance.id },
          groupe: { formateurId: groupe.formateurId },
        },
        include: { groupe: true },
      });
      const conflit = autres.find((s) => {
        const sStart = s.startAt!.getTime();
        const sEnd = sStart + s.dureeMinutes * 60 * 1000;
        return nextStartAt!.getTime() < sEnd && nextEnd > sStart;
      });
      if (conflit) {
        throw new BadRequestException(
          `Conflit d'horaire avec ${conflit.groupe.label} — séance n°${conflit.numero} à ${formatDateTime(conflit.startAt!)}.`
        );
      }
    }

    let dailyRoomName = seance.dailyRoomName;
    let dailyRoomUrl = seance.dailyRoomUrl;

    // Une salle Daily existante a son `exp` calé sur l'horaire/durée en
    // vigueur au moment de sa création — un replanning (date ou durée)
    // laisserait cet `exp` périmé (déjà passé au moment du nouveau
    // créneau), et Daily rejetterait le join avec "This room is no longer
    // available" même si notre fenêtre de rejoin calculée dit que c'est
    // ouvert. On recrée donc la salle pour que l'expiration suive.
    if (nextStartAt && dailyRoomName && (startAtChanged || dureeChanged)) {
      await this.daily.deleteRoom(dailyRoomName);
      dailyRoomName = null;
      dailyRoomUrl = null;
    }

    // Crée la salle Daily la première fois qu'un horaire est renseigné (ou
    // après une recréation ci-dessus suite à un replanning).
    if (nextStartAt && !dailyRoomName) {
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
    objectifs: string | null,
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
      objectifs,
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
      seance.objectifs,
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

  // Nombre de compétences notées par apprenant — voir COMPETENCY_DEFS côté
  // front (gradingGrids.ts) : comprehension_orale/ecrite, expression_orale/
  // ecrite, posture_eloquence. Dupliqué ici en constante plutôt qu'importé
  // (le backend n'a pas de dépendance vers le code frontend).
  private static readonly NB_COMPETENCES = 5;

  // Historique des séances passées d'un groupe — horaire, rappels envoyés,
  // présence (table Presence, alimentée par les webhooks Daily), et moyenne
  // réelle du groupe calculée depuis la table Notation (persistée depuis le
  // 2026-08-07 — auparavant seulement côté state frontend, non partagée).
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
        notations: true,
      },
    });

    return seances.map((s) => {
      const parApprenant = new Map<string, number[]>();
      for (const n of s.notations) {
        if (n.scoreOn20 === null) continue;
        const scores = parApprenant.get(n.apprenantId) ?? [];
        scores.push(n.scoreOn20);
        parApprenant.set(n.apprenantId, scores);
      }
      const moyennesApprenants = [...parApprenant.values()]
        .filter((scores) => scores.length === ClasseVirtuelleService.NB_COMPETENCES)
        .map((scores) => scores.reduce((sum, v) => sum + v, 0) / scores.length);
      const moyenne =
        moyennesApprenants.length > 0
          ? Math.round((moyennesApprenants.reduce((sum, v) => sum + v, 0) / moyennesApprenants.length) * 100) / 100
          : null;

      return {
        numero: s.numero,
        startAt: s.startAt,
        dureeMinutes: s.dureeMinutes,
        objectifs: s.objectifs,
        rappelJ1Envoye: s.rappelJ1EnvoyeAt !== null,
        rappel15minEnvoye: s.rappel15minEnvoyeAt !== null,
        moyenne,
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
      };
    });
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
      seance.objectifs,
      seance.dailyRoomName,
      seance.dailyRoomUrl,
      { userId: apprenant.id, userName: `${apprenant.prenom} ${apprenant.nom}`, isOwner: false }
    );
  }
}
