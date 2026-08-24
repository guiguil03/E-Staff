import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CockpitController } from "./cockpit.controller";
import { CockpitService } from "./cockpit.service";

@Module({
  imports: [PrismaModule],
  controllers: [CockpitController],
  providers: [CockpitService],
})
export class CockpitModule {}
