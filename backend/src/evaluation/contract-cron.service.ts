import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { EvaluationService } from "./evaluation.service";

// Envoi quotidien à 20h (heure de Madagascar) du résultat + contrat pour
// toutes les tentatives validées par la RH dans la journée — voir
// EvaluationService.validateContract pour la génération du PDF, faite en
// amont pour que ce job ne fasse qu'envoyer, pas régénérer, et
// EvaluationService.sendContractNow pour la logique d'envoi elle-même
// (partagée avec le bouton "Envoyer maintenant" de l'admin). contractSentAt
// sert de garde anti-doublon (même principe que
// classe-virtuelle/reminder.service.ts) : un redémarrage backend proche de
// 20h ne fait pas partir deux fois le même e-mail.
@Injectable()
export class ContractCronService {
  private readonly logger = new Logger(ContractCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluation: EvaluationService
  ) {}

  @Cron("0 20 * * *", { timeZone: "Indian/Antananarivo" })
  async sendDueContracts() {
    const attempts = await this.prisma.evaluationAttempt.findMany({
      where: { status: "valide_pret_envoi", contractSentAt: null },
      select: { id: true },
    });

    let sent = 0;
    for (const attempt of attempts) {
      try {
        await this.evaluation.sendContractNow(attempt.id);
        sent++;
      } catch (err) {
        // Un échec (ex. fournisseur email en panne) ne doit pas bloquer
        // l'envoi des autres contrats du lot — la tentative reste
        // "valide_pret_envoi" et sera retentée au prochain passage (20h le
        // lendemain, ou "Envoyer maintenant" depuis l'admin entre-temps).
        this.logger.error(`Échec d'envoi pour la tentative ${attempt.id}`, err as Error);
      }
    }

    if (attempts.length > 0) {
      this.logger.log(`${sent}/${attempts.length} contrat(s) envoyé(s) (job 20h).`);
    }
  }
}
