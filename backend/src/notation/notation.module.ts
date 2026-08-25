import { Module } from "@nestjs/common";
import { NotationController } from "./notation.controller";
import { NotationService } from "./notation.service";
import { StorageService } from "../common/storage.service";

@Module({
  controllers: [NotationController],
  providers: [NotationService, StorageService],
  exports: [NotationService],
})
export class NotationModule {}
