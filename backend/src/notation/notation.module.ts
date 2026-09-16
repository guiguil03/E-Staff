import { Module } from "@nestjs/common";
import { NotationController } from "./notation.controller";
import { NotationService } from "./notation.service";
import { StorageService } from "../common/storage.service";
import { EmailService } from "../common/email.service";

@Module({
  controllers: [NotationController],
  providers: [NotationService, StorageService, EmailService],
  exports: [NotationService],
})
export class NotationModule {}
