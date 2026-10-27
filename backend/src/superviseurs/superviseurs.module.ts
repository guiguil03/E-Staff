import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailService } from "../common/email.service";
import { DailyService } from "../classe-virtuelle/daily.service";
import { SuperviseursController } from "./superviseurs.controller";
import { SuperviseursService } from "./superviseurs.service";

@Module({
  imports: [PrismaModule],
  controllers: [SuperviseursController],
  providers: [SuperviseursService, EmailService, DailyService],
})
export class SuperviseursModule {}
