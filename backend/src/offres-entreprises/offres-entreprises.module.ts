import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { OffresEntreprisesController } from "./offres-entreprises.controller";
import { OffresEntreprisesService } from "./offres-entreprises.service";

@Module({
  imports: [PrismaModule],
  controllers: [OffresEntreprisesController],
  providers: [OffresEntreprisesService],
})
export class OffresEntreprisesModule {}
