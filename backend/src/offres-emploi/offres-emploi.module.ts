import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { OffresEmploiController } from "./offres-emploi.controller";
import { OffresEmploiService } from "./offres-emploi.service";

@Module({
  imports: [PrismaModule],
  controllers: [OffresEmploiController],
  providers: [OffresEmploiService],
  exports: [OffresEmploiService],
})
export class OffresEmploiModule {}
