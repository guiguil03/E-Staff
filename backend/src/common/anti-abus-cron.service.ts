import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { purgerCompteursExpires } from "./anti-abus";

// Ménage horaire de la table CompteurAbus (voir anti-abus.ts).
@Injectable()
export class AntiAbusCronService {
  private readonly logger = new Logger(AntiAbusCronService.name);

  @Cron("17 * * * *")
  async purger() {
    try {
      await purgerCompteursExpires();
    } catch (err) {
      this.logger.error(`Purge des compteurs anti-abus impossible : ${String(err)}`);
    }
  }
}
