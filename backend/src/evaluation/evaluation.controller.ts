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
import { ApiTags } from "@nestjs/swagger";
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
import { RhGuard } from "../common/rh.guard";
import { StaffGuard } from "../common/staff.guard";
import { FormateurGuard } from "../common/formateur.guard";
import { FormateurOuRhGuard } from "../common/formateur-ou-rh.guard";
import { RateLimitGuard } from "../common/rate-limit.guard";
import { isAudio, isPdf, isVideo } from "../common/file-signature";

// Les vidéos sont bien plus volumineuses que l'audio — Multer bufférise en
// mémoire (pas de config disque ici, cohérent avec l'upload audio existant),
// donc une limite explicite est nécessaire pour éviter un upload sans borne.
const MAX_VIDEO_UPLOAD_BYTES = 300 * 1024 * 1024; // 300 Mo
const MAX_CV_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 Mo
// Aucune limite n'existait avant (audit du 2026-09-21) — un enregistrement
// audio de mise en situation dure quelques minutes, 50 Mo est très large.
const MAX_AUDIO_UPLOAD_BYTES = 50 * 1024 * 1024;

@ApiTags("Évaluation")
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

  // Extrait audio du Bloc 4 (compréhension orale), écouté avant le QCM —
  // public pour la même raison que reference-video ci-dessus.
  @Get("oral-audio")
  async streamOralAudio(@Res() res: Response) {
    const { stream, contentType } = await this.service.getOralAudioStream();
    res.set("Content-Type", contentType ?? "audio/mpeg");
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

  @Get("agents-acquisition")
  listAgentsAcquisition() {
    return this.service.listAgentsAcquisition();
  }

  @UseGuards(RateLimitGuard("evaluation-create-candidat", 5))
  @Post("candidats")
  createCandidat(@Body() dto: CreateCandidatDto) {
    return this.service.createCandidat(dto);
  }

  @UseGuards(RateLimitGuard("evaluation-upload-cv", 10))
  @Post("candidats/:id/cv")
  @UseInterceptors(
    FileInterceptor("cv", {
      limits: { fileSize: MAX_CV_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, file.mimetype === "application/pdf");
      },
    })
  )
  uploadCv(@Param("id") id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        "Fichier CV manquant, trop volumineux (10 Mo max) ou pas au format PDF."
      );
    }
    // Vérifie le contenu réel du fichier (signature binaire), pas juste le
    // Content-Type déclaré par le client — voir common/file-signature.ts.
    if (!isPdf(file.buffer)) {
      throw new BadRequestException("Le fichier ne semble pas être un PDF valide.");
    }
    return this.service.uploadCv(id, file);
  }

  // Consultation du CV depuis la fiche RH (Cycle complet) — gardé RhGuard
  // depuis le 2026-09-21 (audit sécurité) : seul appelant identifié
  // (CoordonneesPanel), pas de raison de laisser ça accessible à qui trouve
  // l'URL.
  @UseGuards(RhGuard)
  @Get("candidats/:id/cv")
  async streamCv(@Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getCvStream(id);
    res.set("Content-Type", contentType ?? "application/pdf");
    stream.pipe(res);
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

  // Aucune limite de taille ni de type n'existait avant (audit du
  // 2026-09-21) — n'importe quel fichier, de n'importe quelle taille,
  // pouvait être déposé ici sous couvert d'être un "audio".
  @UseGuards(RateLimitGuard("evaluation-upload-audio", 20))
  @Post("attempts/:id/situations")
  @UseInterceptors(FileInterceptor("audio", { limits: { fileSize: MAX_AUDIO_UPLOAD_BYTES } }))
  uploadSituationAudio(
    @Param("id") id: string,
    @Body() dto: UploadSituationDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException("Fichier audio manquant ou trop volumineux (50 Mo max).");
    }
    if (!isAudio(file.buffer)) {
      throw new BadRequestException("Le fichier ne semble pas être un enregistrement audio valide.");
    }
    return this.service.saveSituationAudio(id, dto.situationIndex, file);
  }

  @UseGuards(RateLimitGuard("evaluation-upload-video", 10))
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
    if (!isVideo(file.buffer)) {
      throw new BadRequestException("Le fichier ne semble pas être une vidéo valide.");
    }
    return this.service.saveVideoResponse(id, dto.taskIndex, file, dto.subjectKey, dto.optionKey);
  }

  // ---- Interface formateur ------------------------------------------------
  // Code formateur partagé (ex-TrainerGuard) retiré temporairement le
  // 2026-08-25 à la demande du client — trop de friction pour l'usage
  // actuel (une poignée de personnes connues). La page reste hors nav,
  // accessible par URL directe uniquement — mais tout le bloc ci-dessous
  // est désormais gardé par FormateurGuard (2026-09-21, audit sécurité) :
  // en s'appuyant sur la session signée (voir common/session.ts), un
  // formateur déjà connecté au Cockpit n'a AUCUNE friction supplémentaire
  // (même cookie), alors qu'avant ce bloc entier — dont le corrigé du test
  // d'admission (questions-corrigees) et la possibilité de noter une
  // réponse candidat — était accessible à quiconque trouvait l'URL, sans
  // même avoir besoin de deviner un identifiant.

  @UseGuards(FormateurGuard)
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

  @UseGuards(FormateurGuard)
  @Get("attempts/:id")
  getAttempt(@Param("id") id: string) {
    return this.service.getAttemptForGrading(id);
  }

  @UseGuards(FormateurGuard)
  @Post("attempts/:id/notify-rh")
  notifyRh(@Param("id") id: string) {
    return this.service.notifyRh(id);
  }

  @UseGuards(FormateurGuard)
  @Get("questions-corrigees")
  getQuestionsWithAnswerKey() {
    return this.service.getQuestionsWithAnswerKey();
  }

  @UseGuards(FormateurGuard)
  @Get("grading-criteria")
  getGradingCriteria() {
    return this.service.getGradingCriteria();
  }

  @UseGuards(FormateurGuard)
  @Get("video-grading-criteria")
  getVideoGradingCriteria() {
    return this.service.getVideoGradingCriteria();
  }

  @UseGuards(FormateurGuard)
  @Get("essay-grading-criteria")
  getEssayGradingCriteria() {
    return this.service.getEssayGradingCriteria();
  }

  @UseGuards(FormateurGuard)
  @Get("partie-ouverte-grading-criteria")
  getPartieOuverteGradingCriteria() {
    return this.service.getPartieOuverteGradingCriteria();
  }

  @UseGuards(FormateurGuard)
  @Post("situation-responses/:id/grade")
  gradeSituationResponse(
    @Param("id") id: string,
    @Body() dto: GradeSituationDto
  ) {
    return this.service.gradeSituationResponse(id, dto.criteria);
  }

  @UseGuards(FormateurGuard)
  @Post("video-responses/:id/grade")
  gradeVideoResponse(@Param("id") id: string, @Body() dto: GradeVideoDto) {
    return this.service.gradeVideoResponse(id, dto.criteria);
  }

  @UseGuards(FormateurGuard)
  @Post("essay-responses/:id/grade")
  gradeEssayResponse(@Param("id") id: string, @Body() dto: GradeEssayDto) {
    return this.service.gradeEssayResponse(id, dto.criteria);
  }

  @UseGuards(FormateurGuard)
  @Post("partie-ouverte-responses/:id/grade")
  gradePartieOuverte(@Param("id") id: string, @Body() dto: GradePartieOuverteDto) {
    return this.service.gradePartieOuverte(id, dto.criteria);
  }

  @UseGuards(FormateurGuard)
  @Get("situation-responses/:id/audio")
  async streamAudio(@Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getSituationAudioStream(id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  // FormateurOuRhGuard (pas FormateurGuard seul) : appelé aussi par
  // CoordonneesPanel (Portail RH), pas seulement par l'interface formateur.
  @UseGuards(FormateurOuRhGuard)
  @Get("video-responses/:id/video")
  async streamVideo(@Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getVideoStream(id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  // ---- Interface RH — validation + paiement (compte RH depuis 2026-09-18,
  // voir rh.controller.ts pour le detail de la scission Admin/RH) ---------

  @UseGuards(RhGuard)
  @Get("pending-validation")
  listPendingValidation() {
    return this.service.listPendingValidation();
  }

  @UseGuards(RhGuard)
  @Get("pipeline-overview")
  listPipelineOverview() {
    return this.service.listPipelineOverview();
  }

  @UseGuards(RhGuard)
  @Post("attempts/:id/validate-contract")
  validateContract(@Param("id") id: string, @Body() dto: ValidateContractDto) {
    return this.service.validateContract(id, dto);
  }

  @UseGuards(RhGuard)
  @Post("attempts/:id/reject")
  rejectCandidate(@Param("id") id: string) {
    return this.service.rejectCandidate(id);
  }

  @UseGuards(RhGuard)
  @Post("attempts/:id/send-now")
  sendContractNow(@Param("id") id: string) {
    return this.service.sendContractNow(id);
  }

  @UseGuards(RhGuard)
  @Get("pending-payment")
  listPendingPayment() {
    return this.service.listPendingPayment();
  }

  // Partagé Admin (FormateursPanel, sélecteur de groupes à la création
  // d'un formateur) / RH (pipeline de recrutement) — voir StaffGuard.
  @UseGuards(StaffGuard)
  @Get("groupes-avec-places")
  listGroupesAvecPlaces() {
    return this.service.listGroupesAvecPlaces();
  }

  @UseGuards(StaffGuard)
  @Post("groupes")
  createGroupe(@Body() dto: CreateGroupeDto) {
    return this.service.createGroupe(dto);
  }

  @UseGuards(RhGuard)
  @Get("stats")
  getStats() {
    return this.service.getStats();
  }

  @UseGuards(RhGuard)
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
