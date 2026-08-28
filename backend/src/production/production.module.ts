import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { StorageService } from "../common/storage.service";
import { ProductionController } from "./production.controller";
import { ProductionService } from "./production.service";

@Module({
  imports: [PrismaModule],
  controllers: [ProductionController],
  providers: [ProductionService, StorageService],
})
export class ProductionModule {}
