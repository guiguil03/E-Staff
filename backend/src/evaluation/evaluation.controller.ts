import {
  BadRequestException,
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
import { UploadVideoDto } from "./dto/upload-video.dto";
import { GradeVideoDto } from "./dto/grade-video.dto";
import { ValidateContractDto } from "./dto/validate-contract.dto";
import { SubmitPaymentReferenceDto } from "./dto/submit-payment-reference.dto";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";
import { CreateGroupeDto } from "./dto/create-groupe.dto";
import { TrainerGuard } from "../common/trainer.guard";
import { AdminGuard } from "../common/admin.guard";

// Les vidéos sont bien plus volumineuses que l'audio — Multer bufférise en
// mémoire (pas de config disque ici, cohérent avec l'upload audio existant),
// donc une limite explicite est nécessaire pour éviter un upload sans borne.
const MAX_VIDEO_UPLOAD_BYTES = 300 * 1024 * 1024; // 300 Mo

@Controller("evaluation")
export class EvaluationController {
  constructor(private readonly service: EvaluationService) {}

  // ---- Parcours candidat (public) ----------------------------------------

  @Get("situations")
  getSituations() {
    return this.service.getSituations();
  }

  @Get("video-tasks")
  getVideoTasks() {
    return this.service.getVideoTasks();
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

  @Post("attempts/:id/videos")
  @UseInterceptors(
    FileInterceptor("video", {
      limits: { fileSize: MAX_VIDEO_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, file.mimetype.startsWith("video/"));
      },
    })
  )
  uploadVideoResponse(
    @Param("id") id: string,
    @Body() dto: UploadVideoDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException(
        "Fichier vidéo manquant, trop volumineux (300 Mo max) ou format non supporté."
      );
    }
    return this.service.saveVideoResponse(id, dto.taskIndex, file);
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
  @Get("video-grading-criteria")
  getVideoGradingCriteria() {
    return this.service.getVideoGradingCriteria();
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
  @Post("video-responses/:id/grade")
  gradeVideoResponse(@Param("id") id: string, @Body() dto: GradeVideoDto) {
    return this.service.gradeVideoResponse(id, dto.criteria);
  }

  @UseGuards(TrainerGuard)
  @Get("situation-responses/:id/audio")
  async streamAudio(@Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getSituationAudioStream(id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  @UseGuards(TrainerGuard)
  @Get("video-responses/:id/video")
  async streamVideo(@Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getVideoStream(id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  // ---- Interface admin (RH) — validation + paiement ----------------------

  @UseGuards(AdminGuard)
  @Get("pending-validation")
  listPendingValidation() {
    return this.service.listPendingValidation();
  }

  @UseGuards(AdminGuard)
  @Get("pipeline-overview")
  listPipelineOverview() {
    return this.service.listPipelineOverview();
  }

  @UseGuards(AdminGuard)
  @Post("attempts/:id/validate-contract")
  validateContract(@Param("id") id: string, @Body() dto: ValidateContractDto) {
    return this.service.validateContract(id, dto);
  }

  @UseGuards(AdminGuard)
  @Post("attempts/:id/reject")
  rejectCandidate(@Param("id") id: string) {
    return this.service.rejectCandidate(id);
  }

  @UseGuards(AdminGuard)
  @Post("attempts/:id/send-now")
  sendContractNow(@Param("id") id: string) {
    return this.service.sendContractNow(id);
  }

  @UseGuards(AdminGuard)
  @Get("pending-payment")
  listPendingPayment() {
    return this.service.listPendingPayment();
  }

  @UseGuards(AdminGuard)
  @Get("groupes-avec-places")
  listGroupesAvecPlaces() {
    return this.service.listGroupesAvecPlaces();
  }

  @UseGuards(AdminGuard)
  @Post("groupes")
  createGroupe(@Body() dto: CreateGroupeDto) {
    return this.service.createGroupe(dto);
  }

  @UseGuards(AdminGuard)
  @Get("stats")
  getStats() {
    return this.service.getStats();
  }

  @UseGuards(AdminGuard)
  @Post("attempts/:id/confirm-payment")
  confirmPayment(@Param("id") id: string, @Body() dto: ConfirmPaymentDto) {
    return this.service.confirmPayment(id, dto);
  }

  // ---- Parcours candidat (public) — contrat + paiement -------------------
  // Accessible uniquement via le lien envoyé par e-mail (attemptId comme
  // jeton), même principe que le reste du parcours candidat sans compte.

  @Get("contrats/:id")
  getContractInfo(@Param("id") id: string) {
    return this.service.getContractInfo(id);
  }

  @Get("contrats/:id/pdf")
  async streamContractPdf(@Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getContractPdfStream(id);
    res.set("Content-Type", contentType ?? "application/pdf");
    stream.pipe(res);
  }

  @Post("contrats/:id/paiement")
  submitPaymentReference(@Param("id") id: string, @Body() dto: SubmitPaymentReferenceDto) {
    return this.service.submitPaymentReference(id, dto);
  }
}
