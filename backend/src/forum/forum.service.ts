import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DailyService } from "../classe-virtuelle/daily.service";
import { UpsertForumLiveDto } from "./dto/upsert-forum-live.dto";

const JOIN_WINDOW_BEFORE_MINUTES = 10;

@Injectable()
export class ForumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly daily: DailyService
  ) {}

  listLives() {
    return this.prisma.forumLive.findMany({ orderBy: { startAt: "desc" } });
  }

  async createLive(dto: UpsertForumLiveDto) {
    if (!dto.titre || !dto.invite) {
      throw new BadRequestException("Titre et invité requis.");
    }
    const live = await this.prisma.forumLive.create({
      data: {
        titre: dto.titre,
        invite: dto.invite,
        description: dto.description,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        dureeMinutes: dto.dureeMinutes ?? 60,
      },
    });
    return this.ensureRoom(live.id);
  }

  private async findLiveOrThrow(id: string) {
    const live = await this.prisma.forumLive.findUnique({ where: { id } });
    if (!live) throw new NotFoundException("Live introuvable.");
    return live;
  }

  async updateLive(id: string, dto: UpsertForumLiveDto) {
    const live = await this.findLiveOrThrow(id);
    await this.prisma.forumLive.update({
      where: { id: live.id },
      data: {
        titre: dto.titre ?? live.titre,
        invite: dto.invite ?? live.invite,
        description: dto.description ?? live.description,
        startAt: dto.startAt !== undefined ? new Date(dto.startAt) : live.startAt,
        dureeMinutes: dto.dureeMinutes ?? live.dureeMinutes,
      },
    });
    return this.ensureRoom(live.id);
  }

  // Crée la salle Daily (broadcast) la première fois qu'un horaire est
  // renseigné pour ce live — même logique que ClasseVirtuelleService.
  private async ensureRoom(id: string) {
    const live = await this.findLiveOrThrow(id);
    if (!live.startAt || live.dailyRoomName) return live;

    const expUnixSeconds =
      Math.floor(live.startAt.getTime() / 1000) + live.dureeMinutes * 60 + 15 * 60;
    const room = await this.daily.createRoom(live.id, expUnixSeconds, true);
    if (!room.roomName) return live;

    return this.prisma.forumLive.update({
      where: { id: live.id },
      data: { dailyRoomName: room.roomName, dailyRoomUrl: room.roomUrl ?? null },
    });
  }

  // Premier live pas encore terminé (ordre croissant) — mêmes règles que
  // firstOngoingOrUpcoming dans ClasseVirtuelleService : ne masque jamais un
  // live futur derrière un live passé non nettoyé. Volume petit, filtrage
  // en mémoire.
  private async firstOngoingOrUpcoming() {
    const lives = await this.prisma.forumLive.findMany({ where: { startAt: { not: null } } });
    const now = Date.now();
    return lives
      .filter((l) => l.startAt !== null)
      .sort((a, b) => a.startAt!.getTime() - b.startAt!.getTime())
      .find((l) => l.startAt!.getTime() + l.dureeMinutes * 60 * 1000 >= now);
  }

  async getProchainLive() {
    const live = await this.firstOngoingOrUpcoming();
    if (!live) return null;
    return {
      id: live.id,
      titre: live.titre,
      invite: live.invite,
      description: live.description,
      startAt: live.startAt,
      dureeMinutes: live.dureeMinutes,
    };
  }

  async getLiveRoom(adminMatricule?: string) {
    const live = await this.firstOngoingOrUpcoming();
    if (!live) return null;

    const configured = Boolean(process.env.DAILY_API_KEY);
    const now = Date.now();
    const opensAt = live.startAt!.getTime() - JOIN_WINDOW_BEFORE_MINUTES * 60 * 1000;
    const closesAt = live.startAt!.getTime() + live.dureeMinutes * 60 * 1000;
    const withinJoinWindow = now >= opensAt && now <= closesAt;

    let roomUrl: string | null = withinJoinWindow && live.dailyRoomName ? live.dailyRoomUrl : null;

    const isAdmin = Boolean(adminMatricule) && adminMatricule === process.env.ADMIN_TEST_MATRICULE;
    if (roomUrl && live.dailyRoomName) {
      const token = await this.daily.mintMeetingToken({
        roomName: live.dailyRoomName,
        userId: isAdmin ? "admin" : `spectateur-${Date.now()}`,
        userName: isAdmin ? "Administration e-Staf" : "Spectateur",
        isOwner: isAdmin,
      });
      if (token) roomUrl = `${roomUrl}?t=${token}`;
    }

    return {
      id: live.id,
      titre: live.titre,
      invite: live.invite,
      startAt: live.startAt,
      withinJoinWindow,
      configured,
      roomUrl,
    };
  }
}
