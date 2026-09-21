import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { renderEmailHtml, emailParagraph, ctaButton } from "../common/email-template";

const APP_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// Rappels de séance : J-1 et 15 minutes avant. Basé sur un seuil franchi
// ("l'échéance est passée et pas encore envoyé") plutôt qu'une fenêtre
// stricte alignée sur le cron — un cron manqué ou un redémarrage backend ne
// fait pas sauter le rappel, il part simplement au prochain tick. Le
// marquage rappelJ1EnvoyeAt/rappel15minEnvoyeAt est ce qui empêche les
// doublons, pas le timing du cron.
@Injectable()
export class ClasseVirtuelleReminderService {
  private readonly logger = new Logger(ClasseVirtuelleReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService
  ) {}

  @Cron("*/5 * * * *")
  async handleReminders() {
    await this.sendDueReminders({
      thresholdMs: 24 * 60 * 60 * 1000,
      flagField: "rappelJ1EnvoyeAt",
      subject: (groupeLabel: string) => `Rappel — votre séance de demain (${groupeLabel})`,
      buildText: (prenom: string, groupeLabel: string, startAt: Date, link: string) =>
        `Bonjour ${prenom},\n\nPetit rappel : votre prochaine séance (${groupeLabel}) a lieu demain, le ${formatDateTime(startAt)}.\n\nVous pourrez rejoindre la classe virtuelle ici, 10 minutes avant le début :\n${link}\n\nÀ bientôt,\nL'équipe e-Staf`,
      buildHtml: (prenom: string, groupeLabel: string, startAt: Date, link: string) =>
        renderEmailHtml({
          title: "Rappel — séance de demain",
          preheader: `${groupeLabel} — ${formatDateTime(startAt)}`,
          bodyHtml:
            emailParagraph(`Bonjour ${prenom},`) +
            emailParagraph(
              `Petit rappel : votre prochaine séance (${groupeLabel}) a lieu demain, le ${formatDateTime(startAt)}.`
            ) +
            emailParagraph("Vous pourrez rejoindre la classe virtuelle 10 minutes avant le début.") +
            ctaButton("Accéder à la classe virtuelle", link),
        }),
    });

    await this.sendDueReminders({
      thresholdMs: 15 * 60 * 1000,
      flagField: "rappel15minEnvoyeAt",
      subject: (groupeLabel: string) => `Votre classe virtuelle commence bientôt (${groupeLabel})`,
      buildText: (prenom: string, groupeLabel: string, startAt: Date, link: string) =>
        `Bonjour ${prenom},\n\nVotre séance (${groupeLabel}) commence dans 15 minutes, à ${formatDateTime(startAt)}.\n\nRejoignez la classe virtuelle ici :\n${link}\n\nÀ tout de suite,\nL'équipe e-Staf`,
      buildHtml: (prenom: string, groupeLabel: string, startAt: Date, link: string) =>
        renderEmailHtml({
          title: "Votre classe virtuelle commence bientôt",
          preheader: `${groupeLabel} — dans 15 minutes`,
          bodyHtml:
            emailParagraph(`Bonjour ${prenom},`) +
            emailParagraph(
              `Votre séance (${groupeLabel}) commence dans 15 minutes, à ${formatDateTime(startAt)}.`
            ) +
            ctaButton("Rejoindre la classe virtuelle", link),
        }),
    });
  }

  private async sendDueReminders(params: {
    thresholdMs: number;
    flagField: "rappelJ1EnvoyeAt" | "rappel15minEnvoyeAt";
    subject: (groupeLabel: string) => string;
    buildText: (prenom: string, groupeLabel: string, startAt: Date, link: string) => string;
    buildHtml: (prenom: string, groupeLabel: string, startAt: Date, link: string) => string;
  }) {
    const now = Date.now();
    const dueSeances = await this.prisma.seance.findMany({
      where: {
        startAt: { not: null, lte: new Date(now + params.thresholdMs) },
        [params.flagField]: null,
      },
      include: { groupe: { include: { apprenants: true } } },
    });

    for (const seance of dueSeances) {
      // Ne rappelle pas une séance déjà commencée (rattrapage après un
      // redémarrage backend qui aurait fait manquer la fenêtre).
      if (!seance.startAt || seance.startAt.getTime() <= now) continue;

      // Ne marque le rappel "envoyé" que si aucun envoi n'a réellement
      // échoué (2026-09-21, audit — avant ça, un échec réseau/fournisseur
      // marquait quand même le flag : l'apprenant n'était alors JAMAIS
      // relancé, sans qu'aucune alerte ne le signale). "no-provider-
      // configured" (mode dev sans clé API) ne compte pas comme un échec —
      // voir EmailService, c'est un comportement dégradé assumé, pas une
      // panne à réessayer.
      const link = `${APP_URL}/compte/apprenant/classe-virtuelle`;
      let toutEnvoye = true;
      for (const apprenant of seance.groupe.apprenants) {
        const result = await this.email.send({
          to: apprenant.email,
          subject: params.subject(seance.groupe.label),
          text: params.buildText(apprenant.prenom, seance.groupe.label, seance.startAt, link),
          html: params.buildHtml(apprenant.prenom, seance.groupe.label, seance.startAt, link),
        });
        if (!result.delivered && result.reason !== "no-provider-configured") {
          toutEnvoye = false;
          this.logger.error(
            `Échec d'envoi du rappel (${params.flagField}) à ${apprenant.email} pour la séance ${seance.groupe.label} n°${seance.numero} (${result.reason}) — nouvel essai au prochain cron.`
          );
        }
      }

      if (!toutEnvoye) continue;

      await this.prisma.seance.update({
        where: { id: seance.id },
        data: { [params.flagField]: new Date() },
      });

      this.logger.log(
        `Rappel (${params.flagField}) envoyé pour la séance ${seance.groupe.label} n°${seance.numero} (${seance.groupe.apprenants.length} apprenant(s)).`
      );
    }
  }
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Indian/Antananarivo",
  });
}
