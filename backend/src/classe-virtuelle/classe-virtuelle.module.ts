import { Module } from "@nestjs/common";
import { ClasseVirtuelleController } from "./classe-virtuelle.controller";
import { ClasseVirtuelleService } from "./classe-virtuelle.service";
import { ClasseVirtuelleReminderService } from "./reminder.service";
import { DailyService } from "./daily.service";
import { DailyWebhookController } from "./daily-webhook.controller";
import { PresenceService } from "./presence.service";
import { EnregistrementService } from "./enregistrement.service";
import { SeanceLiveService } from "./seance-live.service";
import { SeanceLiveController } from "./seance-live.controller";
import { StorageService } from "../common/storage.service";
import { EmailService } from "../common/email.service";

@Module({
  controllers: [ClasseVirtuelleController, DailyWebhookController, SeanceLiveController],
  providers: [
    ClasseVirtuelleService,
    ClasseVirtuelleReminderService,
    DailyService,
    PresenceService,
    EnregistrementService,
    SeanceLiveService,
    StorageService,
    EmailService,
  ],
})
export class ClasseVirtuelleModule {}
