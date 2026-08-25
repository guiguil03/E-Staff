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
import { SubmitEssayDto } from "./dto/submit-essay.dto";
import { GradeEssayDto } from "./dto/grade-essay.dto";
import { SubmitPartieOuverteDto } from "./dto/submit-partie-ouverte.dto";
import { GradePartieOuverteDto } from "./dto/grade-partie-ouverte.dto";
import { ValidateContractDto } from "./dto/validate-contract.dto";
import { SubmitPaymentReferenceDto } from "./dto/submit-payment-reference.dto";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";
import { CreateGroupeDto } from "./dto/create-groupe.dto";
import { AdminGuard } from "../common/admin.guard";
import { FormateurGuard } from "../common/formateur.guard";

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

  // Vidéo de contexte à visionner avant l'enregistrement (ex. reportage sur
  // le sujet du débat) — publique comme le reste du parcours candidat, pas
  // de garde : c'est un contenu diffusé à tous, pas une donnée personnelle.
  @Get("video-tasks/:index/subjects/:subjectKey/reference-video")
  async streamReferenceVideo(
    @Param("index") index: string,
    @Param("subjectKey") subjectKey: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getReferenceVideoStream(
      Number(index),
      subjectKey
    );
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  @Get("questions")
  getQuestions() {
    return this.service.getQuestions();
  }

  @Get("essay-subjects")
  getEssaySubjects() {
    return this.service.getEssaySubjects();
  }

  @Get("partie-ouverte")
  getPartieOuverteContent() {
    return this.service.getPartieOuverteContent();
  }

  @Post("candidats")
  createCandidat(@Body() dto: CreateCandidatDto) {
    return this.service.createCandidat(dto);
  }

  @Post("attempts/:id/submit")
  submitAnswers(@Param("id") id: string, @Body() dto: SubmitAnswersDto) {
    return this.service.submitAnswers(id, dto);
  }

  @Post("attempts/:id/essay")
  submitEssay(@Param("id") id: string, @Body() dto: SubmitEssayDto) {
    return this.service.submitEssay(id, dto);
  }

  @Post("attempts/:id/partie-ouverte")
  submitPartieOuverte(@Param("id") id: string, @Body() dto: SubmitPartieOuverteDto) {
    return this.service.submitPartieOuverte(id, dto);
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
    return this.service.saveVideoResponse(id, dto.taskIndex, file, dto.subjectKey, dto.optionKey);
  }

  // ---- Interface formateur ------------------------------------------------
  // Code formateur (TrainerGuard) retiré temporairement le 2026-08-25 à la
  // demande du client — trop de friction pour l'usage actuel (une poignée
  // de personnes connues). La page reste hors nav, accessible par URL
  // directe uniquement. À réintroduire une vraie auth avant d'ouvrir l'accès
  // plus largement (voir TrainerGuard, toujours défini dans common/, pas
  // supprimé).

  @Get("attempts")
  listAttemptsForGrading() {
    return this.service.listAttemptsForGrading();
  }

  // Compte seul, gardé par le matricule du Cockpit Formateur (pas le code
  // formateur partagé de /evaluation/formateur) — signale la file de
  // correction des tests d'admission depuis le Cockpit sans donner accès
  // aux données des candidats via ce guard-là. Voir countAttemptsForGrading.
  @UseGuards(FormateurGuard)
  @Get("attempts-pending-count")
  countAttemptsForGrading() {
    return this.service.countAttemptsForGrading();
  }

  @Get("attempts/:id")
  getAttempt(@Param("id") id: string) {
    return this.service.getAttemptForGrading(id);
  }

  @Get("grading-criteria")
  getGradingCriteria() {
    return this.service.getGradingCriteria();
  }

  @Get("video-grading-criteria")
  getVideoGradingCriteria() {
    return this.service.getVideoGradingCriteria();
  }

  @Get("essay-grading-criteria")
  getEssayGradingCriteria() {
    return this.service.getEssayGradingCriteria();
  }

  @Get("partie-ouverte-grading-criteria")
  getPartieOuverteGradingCriteria() {
    return this.service.getPartieOuverteGradingCriteria();
  }

  @Post("situation-responses/:id/grade")
  gradeSituationResponse(
    @Param("id") id: string,
    @Body() dto: GradeSituationDto
  ) {
    return this.service.gradeSituationResponse(id, dto.criteria);
  }

  @Post("video-responses/:id/grade")
  gradeVideoResponse(@Param("id") id: string, @Body() dto: GradeVideoDto) {
    return this.service.gradeVideoResponse(id, dto.criteria);
  }

  @Post("essay-responses/:id/grade")
  gradeEssayResponse(@Param("id") id: string, @Body() dto: GradeEssayDto) {
    return this.service.gradeEssayResponse(id, dto.criteria);
  }

  @Post("partie-ouverte-responses/:id/grade")
  gradePartieOuverte(@Param("id") id: string, @Body() dto: GradePartieOuverteDto) {
    return this.service.gradePartieOuverte(id, dto.criteria);
  }

  @Get("situation-responses/:id/audio")
  async streamAudio(@Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getSituationAudioStream(id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

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
