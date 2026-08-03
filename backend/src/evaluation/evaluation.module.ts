import { Module } from "@nestjs/common";
import { EvaluationController } from "./evaluation.controller";
import { EvaluationService } from "./evaluation.service";
import { EmailService } from "../common/email.service";

@Module({
  controllers: [EvaluationController],
  providers: [EvaluationService, EmailService],
})
export class EvaluationModule {}
