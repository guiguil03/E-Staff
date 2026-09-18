import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { renderEmailHtml, emailParagraph, ctaButton } from "../common/email-template";

const APP_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService
  ) {}

  private async resolveRole(userId?: string): Promise<{ role: string; apprenantId: string | null }> {
    if (!userId) return { role: "inconnu", apprenantId: null };
    const apprenant = await this.prisma.apprenant.findUnique({ where: { id: userId } });
    if (apprenant) return { role: "apprenant", apprenantId: apprenant.id };
    const formateur = await this.prisma.formateur.findUnique({ where: { id: userId } });
    if (formateur) return { role: "formateur", apprenantId: null };
    return { role: "inconnu", apprenantId: null };
  }

  async recordJoin(payload: JoinLeavePayload) {
    const seance = await this.prisma.seance.findUnique({
      where: { id: payload.room },
      include: { groupe: { include: { apprenants: true } } },
    });
    if (!seance) {
      this.logger.warn(`participant.joined pour une salle inconnue (${payload.room})`);
      return;
    }
    const { role, apprenantId } = await this.resolveRole(payload.user_id);

    // Vérifié avant l'upsert : un formateur qui se reconnecte (crash,
    // rafraîchissement) crée une nouvelle ligne Presence (session_id
    // différent) mais ne doit pas redéclencher l'e-mail "la classe démarre".
    const formateurDejaConnecte =
      role === "formateur" &&
      (await this.prisma.presence.count({ where: { seanceId: seance.id, role: "formateur" } })) > 0;

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

    if (role === "formateur" && !formateurDejaConnecte) {
      await this.notifierClasseDemarree(seance);
    }
  }

  // E-mail immédiat dès que le formateur est le premier à rejoindre la
  // salle — complète les rappels J-1/15min (voir ClasseVirtuelleReminderService,
  // basés sur l'heure programmée, pas sur le démarrage réel).
  private async notifierClasseDemarree(seance: {
    numero: number;
    groupe: { label: string; apprenants: { prenom: string; email: string }[] };
  }) {
    const link = `${APP_URL}/compte/apprenant/classe-virtuelle`;
    for (const apprenant of seance.groupe.apprenants) {
      await this.email.send({
        to: apprenant.email,
        subject: `Votre classe virtuelle vient de commencer (${seance.groupe.label})`,
        text: `Bonjour ${apprenant.prenom},\n\nVotre formateur vient de démarrer la séance n°${seance.numero} (${seance.groupe.label}).\n\nRejoignez la classe virtuelle ici :\n${link}\n\nÀ tout de suite,\nL'équipe e-Staf`,
        html: renderEmailHtml({
          title: "Votre classe virtuelle commence",
          preheader: `${seance.groupe.label} — séance n°${seance.numero}`,
          bodyHtml:
            emailParagraph(`Bonjour ${apprenant.prenom},`) +
            emailParagraph(
              `Votre formateur vient de démarrer la séance n°${seance.numero} (${seance.groupe.label}).`
            ) +
            ctaButton("Rejoindre maintenant", link),
        }),
      });
    }
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
