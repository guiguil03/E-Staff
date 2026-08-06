import { Module } from "@nestjs/common";
import { ClasseVirtuelleController } from "./classe-virtuelle.controller";
import { ClasseVirtuelleService } from "./classe-virtuelle.service";
import { ClasseVirtuelleReminderService } from "./reminder.service";
import { DailyService } from "./daily.service";
import { DailyWebhookController } from "./daily-webhook.controller";
import { PresenceService } from "./presence.service";
import { EmailService } from "../common/email.service";

@Module({
  controllers: [ClasseVirtuelleController, DailyWebhookController],
  providers: [
    ClasseVirtuelleService,
    ClasseVirtuelleReminderService,
    DailyService,
    PresenceService,
    EmailService,
  ],
})
export class ClasseVirtuelleModule {}
