import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { TIER_LABELS } from "./evaluation.service";

const APP_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// Envoi quotidien à 20h (heure de Madagascar) du résultat + contrat pour
// toutes les tentatives validées par la RH dans la journée — voir
// EvaluationService.validateContract pour la génération du PDF, faite en
// amont pour que ce job ne fasse qu'envoyer, pas régénérer. contractSentAt
// sert de garde anti-doublon (même principe que
// classe-virtuelle/reminder.service.ts) : un redémarrage backend proche de
// 20h ne fait pas partir deux fois le même e-mail.
@Injectable()
export class ContractCronService {
  private readonly logger = new Logger(ContractCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService
  ) {}

  @Cron("0 20 * * *", { timeZone: "Indian/Antananarivo" })
  async sendDueContracts() {
    const attempts = await this.prisma.evaluationAttempt.findMany({
      where: { status: "valide_pret_envoi", contractSentAt: null },
      include: { candidat: true },
    });

    for (const attempt of attempts) {
      const link = `${APP_URL}/evaluation/contrat/${attempt.id}`;
      const tierLabel = attempt.tier ? TIER_LABELS[attempt.tier] ?? attempt.tier : "";

      await this.email.send({
        to: attempt.candidat.email,
        subject: "Votre résultat e-Staf et votre contrat de formation",
        text: `Bonjour ${attempt.candidat.firstName},\n\nVotre évaluation a été traitée.\nRésultat : ${tierLabel}.\n\nVotre contrat de formation (durée, frais, conditions) et les prochaines étapes vous attendent ici :\n${link}\n\nÀ bientôt,\nL'équipe e-Staf`,
      });

      await this.prisma.evaluationAttempt.update({
        where: { id: attempt.id },
        data: { status: "contrat_envoye", contractSentAt: new Date() },
      });
    }

    if (attempts.length > 0) {
      this.logger.log(`${attempts.length} contrat(s) envoyé(s) (job 20h).`);
    }
  }
}
