import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { FormateurGuard } from "../common/formateur.guard";
import { ApprenantGuard } from "../common/apprenant.guard";
import { RateLimitGuard } from "../common/rate-limit.guard";
import { isAudio, isImage, isOfficeDocument, isPdf, isVideo, readLeadingBytes } from "../common/file-signature";
import { NotationService } from "./notation.service";
import { GradeNotationDto } from "./dto/grade-notation.dto";
import { SubmitRenewalPaymentDto } from "./dto/submit-renewal-payment.dto";

// Devoirs apprenant : vidéo possible pour l'oral (exposé), d'où une limite
// large — fichier temporaire sur disque, pas bufférisé en RAM (audit
// scalabilité du 2026-10-08 : plusieurs dépôts vidéo simultanés en Buffer
// pouvaient épuiser la RAM du process), sans limite un upload serait sans
// borne (même logique que evaluation.controller.ts).
const MAX_DEVOIR_UPLOAD_BYTES = 200 * 1024 * 1024; // 200 Mo
// Trois compétences déposables (expression_orale/posture_eloquence :
// audio/vidéo ; expression_ecrite : document ou photo d'un écrit) — voir
// NotationService.DEVOIR_COMPETENCES. Aucune vérification de type n'existait
// avant (audit sécurité du 2026-10-08) : file.mimetype était stocké et
// servi tel quel, sans même un fileFilter.
const DEVOIR_MIMETYPES = [
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
];
function matchesDevoirSignature(mimetype: string, buffer: Buffer): boolean {
  if (mimetype.startsWith("video/")) return isVideo(buffer);
  if (mimetype.startsWith("audio/")) return isAudio(buffer);
  if (mimetype.startsWith("image/")) return isImage(buffer);
  return isOfficeDocument(buffer);
}
// Reçu de paiement du renouvellement — mêmes limites que
// registrations.controller.ts (reçu de paiement de l'inscription).
const MAX_RECEIPT_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 Mo
const RECEIPT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

@ApiTags("Notation")
@Controller()
export class NotationController {
  constructor(private readonly service: NotationService) {}

  // ---- Formateur -----------------------------------------------------------

  @Get("notations/a-corriger")
  @UseGuards(FormateurGuard)
  listACorriger(@Headers("x-formateur-matricule") formateurMatricule: string) {
    return this.service.listACorriger(formateurMatricule);
  }

  @Get("notations/corriges")
  @UseGuards(FormateurGuard)
  listCorriges(@Headers("x-formateur-matricule") formateurMatricule: string) {
    return this.service.listCorriges(formateurMatricule);
  }

  @Get("notations/:id/devoir")
  @UseGuards(FormateurGuard)
  async streamDevoir(
    @Param("id") id: string,
    @Headers("x-formateur-matricule") formateurMatricule: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getDevoirStream(id, formateurMatricule);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  @Get("notations/:groupeCle/:numero")
  @UseGuards(FormateurGuard)
  listNotationsForSeance(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.listNotationsForSeance(groupeCle, numero, formateurMatricule);
  }

  @Get("notations/:groupeCle/:numero/:apprenantMatricule/:competence")
  @UseGuards(FormateurGuard)
  getNotation(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Param("apprenantMatricule") apprenantMatricule: string,
    @Param("competence") competence: string,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.getNotation(groupeCle, numero, apprenantMatricule, competence, formateurMatricule);
  }

  @Put("notations/:groupeCle/:numero/:apprenantMatricule/:competence")
  @UseGuards(FormateurGuard)
  gradeNotation(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Param("apprenantMatricule") apprenantMatricule: string,
    @Param("competence") competence: string,
    @Body() dto: GradeNotationDto,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.gradeNotation(groupeCle, numero, apprenantMatricule, competence, dto, formateurMatricule);
  }

  // ---- Apprenant (pas de guard — même niveau de protection stopgap que le
  // reste du Compte Apprenant — désormais gardé par ApprenantGuard : la
  // session doit correspondre exactement au matricule de l'URL (voir
  // apprenant.guard.ts), ce qui ferme l'IDOR par itération de matricule.

  @UseGuards(ApprenantGuard)
  @Get("apprenants/:matricule/dashboard")
  getApprenantDashboard(@Param("matricule") matricule: string) {
    return this.service.getApprenantDashboard(matricule);
  }

  @UseGuards(ApprenantGuard)
  @Get("apprenants/:matricule/annonces")
  listAnnoncesForApprenant(@Param("matricule") matricule: string) {
    return this.service.listAnnoncesForApprenant(matricule);
  }

  @UseGuards(ApprenantGuard)
  @Get("apprenants/:matricule/notations")
  listApprenantNotations(@Param("matricule") matricule: string) {
    return this.service.listApprenantNotations(matricule);
  }

  @UseGuards(ApprenantGuard)
  @Get("apprenants/:matricule/notations/:numero/:competence")
  getApprenantNotationDetail(
    @Param("matricule") matricule: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Param("competence") competence: string
  ) {
    return this.service.getApprenantNotationDetail(matricule, numero, competence);
  }

  @UseGuards(ApprenantGuard)
  @Post("apprenants/:matricule/notations/:numero/:competence/devoir")
  @UseInterceptors(
    FileInterceptor("fichier", {
      storage: diskStorage({ destination: tmpdir() }),
      limits: { fileSize: MAX_DEVOIR_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, DEVOIR_MIMETYPES.includes(file.mimetype));
      },
    })
  )
  async uploadDevoir(
    @Param("matricule") matricule: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Param("competence") competence: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException(
        "Fichier manquant, trop volumineux (200 Mo max) ou format non supporté (vidéo, audio, PDF, Word, image)."
      );
    }
    try {
      const leading = await readLeadingBytes(file.path);
      if (!matchesDevoirSignature(file.mimetype, leading)) {
        throw new BadRequestException("Le fichier déposé ne correspond pas au format déclaré.");
      }
      return await this.service.uploadDevoir(matricule, numero, competence, file);
    } finally {
      await unlink(file.path).catch(() => {});
    }
  }

  // ---- Renouvellement déclaratif — voir NotationService pour le détail --

  @UseGuards(ApprenantGuard)
  @Get("apprenants/:matricule/renouvellement")
  getRenewalInfo(@Param("matricule") matricule: string) {
    return this.service.getRenewalInfo(matricule);
  }

  @UseGuards(ApprenantGuard, RateLimitGuard("apprenant-renouvellement-paiement", 10))
  @Post("apprenants/:matricule/renouvellement")
  @UseInterceptors(
    FileInterceptor("recu", {
      limits: { fileSize: MAX_RECEIPT_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, RECEIPT_MIME_TYPES.includes(file.mimetype));
      },
    })
  )
  async submitRenewalPayment(
    @Param("matricule") matricule: string,
    @Body() dto: SubmitRenewalPaymentDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (file && !isPdf(file.buffer) && !isImage(file.buffer)) {
      throw new BadRequestException("Le fichier ne semble pas être un PDF ou une image valide.");
    }
    return this.service.submitRenewalPayment(matricule, dto.reference, file);
  }
}
