import { Module } from "@nestjs/common";
import { ClasseVirtuelleController } from "./classe-virtuelle.controller";
import { ClasseVirtuelleService } from "./classe-virtuelle.service";
import { ClasseVirtuelleReminderService } from "./reminder.service";
import { DailyService } from "./daily.service";
import { EmailService } from "../common/email.service";

@Module({
  controllers: [ClasseVirtuelleController],
  providers: [ClasseVirtuelleService, ClasseVirtuelleReminderService, DailyService, EmailService],
})
export class ClasseVirtuelleModule {}
