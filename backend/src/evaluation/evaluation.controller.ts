import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { EvaluationService } from "./evaluation.service";
import { CreateCandidatDto } from "./dto/create-candidat.dto";
import { SubmitAnswersDto } from "./dto/submit-answers.dto";
import { UploadSituationDto } from "./dto/upload-situation.dto";
import { GradeSituationDto } from "./dto/grade-situation.dto";
import { TrainerGuard } from "../common/trainer.guard";

@Controller("evaluation")
export class EvaluationController {
  constructor(private readonly service: EvaluationService) {}

  // ---- Parcours candidat (public) ----------------------------------------

  @Get("situations")
  getSituations() {
    return this.service.getSituations();
  }

  @Get("questions")
  getQuestions() {
    return this.service.getQuestions();
  }

  @Post("candidats")
  createCandidat(@Body() dto: CreateCandidatDto) {
    return this.service.createCandidat(dto);
  }

  @Post("attempts/:id/submit")
  submitAnswers(@Param("id") id: string, @Body() dto: SubmitAnswersDto) {
    return this.service.submitAnswers(id, dto);
  }

  @Post("attempts/:id/situations")
  @UseInterceptors(FileInterceptor("audio"))
  uploadSituationAudio(
    @Param("id") id: string,
    @Body() dto: UploadSituationDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.service.saveSituationAudio(id, dto.situationIndex, file);
  }

  // ---- Interface formateur (gardée) --------------------------------------

  @UseGuards(TrainerGuard)
  @Get("attempts")
  listAttemptsForGrading() {
    return this.service.listAttemptsForGrading();
  }

  @UseGuards(TrainerGuard)
  @Get("attempts/:id")
  getAttempt(@Param("id") id: string) {
    return this.service.getAttemptForGrading(id);
  }

  @UseGuards(TrainerGuard)
  @Get("grading-criteria")
  getGradingCriteria() {
    return this.service.getGradingCriteria();
  }

  @UseGuards(TrainerGuard)
  @Post("situation-responses/:id/grade")
  gradeSituationResponse(
    @Param("id") id: string,
    @Body() dto: GradeSituationDto
  ) {
    return this.service.gradeSituationResponse(id, dto.criteria);
  }

  @UseGuards(TrainerGuard)
  @Post("attempts/:id/send-result")
  sendResult(@Param("id") id: string) {
    return this.service.sendResultEmail(id);
  }

  @UseGuards(TrainerGuard)
  @Get("situation-responses/:id/audio")
  async streamAudio(@Param("id") id: string, @Res() res: Response) {
    const fullPath = await this.service.getSituationAudioPath(id);
    res.sendFile(fullPath);
  }
}
