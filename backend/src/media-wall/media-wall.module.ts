import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { StorageService } from "../common/storage.service";
import { MediaWallController } from "./media-wall.controller";
import { MediaWallService } from "./media-wall.service";

@Module({
  imports: [PrismaModule],
  controllers: [MediaWallController],
  providers: [MediaWallService, StorageService],
})
export class MediaWallModule {}
