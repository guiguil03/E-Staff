import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { StorageService } from "../common/storage.service";
import { EmailService } from "../common/email.service";
import { SupportCoursController } from "./support-cours.controller";
import { SupportCoursService } from "./support-cours.service";

@Module({
  imports: [PrismaModule],
  controllers: [SupportCoursController],
  providers: [SupportCoursService, StorageService, EmailService],
})
export class SupportCoursModule {}
