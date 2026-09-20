import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { StorageService } from "../common/storage.service";
import { CockpitController } from "./cockpit.controller";
import { CockpitService } from "./cockpit.service";

@Module({
  imports: [PrismaModule],
  controllers: [CockpitController],
  providers: [CockpitService, StorageService],
  exports: [CockpitService],
})
export class CockpitModule {}
