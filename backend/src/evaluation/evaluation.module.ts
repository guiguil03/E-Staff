import { Module } from "@nestjs/common";
import { EvaluationController } from "./evaluation.controller";
import { EvaluationService } from "./evaluation.service";
import { ContractCronService } from "./contract-cron.service";
import { EmailService } from "../common/email.service";
import { StorageService } from "../common/storage.service";

@Module({
  controllers: [EvaluationController],
  providers: [EvaluationService, ContractCronService, EmailService, StorageService],
})
export class EvaluationModule {}
