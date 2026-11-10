import { Module } from "@nestjs/common";
import { CalWebhookController } from "./cal-webhook.controller";
import { EntreprisesProjetsController } from "./entreprises-projets.controller";
import { EntreprisesProjetsService } from "./entreprises-projets.service";

@Module({
  controllers: [EntreprisesProjetsController, CalWebhookController],
  providers: [EntreprisesProjetsService],
})
export class EntreprisesProjetsModule {}
