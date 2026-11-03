import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailService } from "../common/email.service";
import { StorageService } from "../common/storage.service";
import { DailyService } from "../classe-virtuelle/daily.service";
import { ProductionModule } from "../production/production.module";
import { EntreprisesComptesController } from "./entreprises-comptes.controller";
import { EntreprisesComptesService } from "./entreprises-comptes.service";

@Module({
  imports: [PrismaModule, ProductionModule],
  controllers: [EntreprisesComptesController],
  providers: [EntreprisesComptesService, EmailService, StorageService, DailyService],
  exports: [EntreprisesComptesService],
})
export class EntreprisesComptesModule {}
