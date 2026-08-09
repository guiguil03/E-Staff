import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface JoinLeavePayload {
  room: string; // = Seance.id (nom de salle Daily = seance.id, voir createRoom)
  user_id?: string;
  user_name?: string;
  session_id: string;
  joined_at?: number;
  left_at?: number;
}

// Alimente Presence à partir des webhooks Daily. user_id vient du jeton de
// réunion nominatif miné par ClasseVirtuelleService (apprenant.id ou
// formateur.id) — voir daily.service.ts mintMeetingToken. Sans jeton (salle
// rejointe hors du flux normal, ou fournisseur non configuré), user_id est
// absent et le rôle retombe sur "inconnu".
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async resolveRole(userId?: string): Promise<{ role: string; apprenantId: string | null }> {
    if (!userId) return { role: "inconnu", apprenantId: null };
    const apprenant = await this.prisma.apprenant.findUnique({ where: { id: userId } });
    if (apprenant) return { role: "apprenant", apprenantId: apprenant.id };
    const formateur = await this.prisma.formateur.findUnique({ where: { id: userId } });
    if (formateur) return { role: "formateur", apprenantId: null };
    return { role: "inconnu", apprenantId: null };
  }

  async recordJoin(payload: JoinLeavePayload) {
    const seance = await this.prisma.seance.findUnique({ where: { id: payload.room } });
    if (!seance) {
      this.logger.warn(`participant.joined pour une salle inconnue (${payload.room})`);
      return;
    }
    const { role, apprenantId } = await this.resolveRole(payload.user_id);

    await this.prisma.presence.upsert({
      where: { dailyParticipantId: payload.session_id },
      update: {},
      create: {
        seanceId: seance.id,
        apprenantId,
        role,
        dailyParticipantId: payload.session_id,
        displayName: payload.user_name ?? null,
        joinedAt: payload.joined_at ? new Date(payload.joined_at * 1000) : new Date(),
      },
    });
  }

  async recordLeave(payload: JoinLeavePayload) {
    const existing = await this.prisma.presence.findUnique({
      where: { dailyParticipantId: payload.session_id },
    });
    const leftAt = payload.left_at ? new Date(payload.left_at * 1000) : new Date();

    if (!existing) {
      // Événement "left" sans "joined" correspondant (redémarrage backend
      // pendant la session, par ex.) — on garde une trace minimale plutôt
      // que de la perdre.
      const seance = await this.prisma.seance.findUnique({ where: { id: payload.room } });
      if (!seance) return;
      const { role, apprenantId } = await this.resolveRole(payload.user_id);
      await this.prisma.presence.create({
        data: {
          seanceId: seance.id,
          apprenantId,
          role,
          dailyParticipantId: payload.session_id,
          displayName: payload.user_name ?? null,
          joinedAt: leftAt,
          leftAt,
          dureeSecondes: 0,
        },
      });
      return;
    }

    const dureeSecondes = Math.max(0, Math.round((leftAt.getTime() - existing.joinedAt.getTime()) / 1000));
    await this.prisma.presence.update({
      where: { id: existing.id },
      data: { leftAt, dureeSecondes },
    });
  }
}
