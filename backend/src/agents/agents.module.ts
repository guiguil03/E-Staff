import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailService } from "../common/email.service";
import { StorageService } from "../common/storage.service";
import { AgentsController } from "./agents.controller";
import { AgentsService } from "./agents.service";

@Module({
  imports: [PrismaModule],
  controllers: [AgentsController],
  providers: [AgentsService, EmailService, StorageService],
})
export class AgentsModule {}
