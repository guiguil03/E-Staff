import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { FormateurGuard } from "../common/formateur.guard";
import { SupportCoursService } from "./support-cours.service";

const MAX_SUPPORT_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 Mo (documents + audio/vidéo)
const ALLOWED_SUPPORT_MIMETYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
];

// Supports de cours partagés par un formateur aux apprenants de ses
// groupes — voir support-cours.service.ts pour la distinction avec les
// fiches de préparation (CockpitController /documents, usage RH/perso).
@ApiTags("Supports de cours")
@Controller()
export class SupportCoursController {
  constructor(private readonly service: SupportCoursService) {}

  // ---- Formateur -----------------------------------------------------------

  @Post("supports-cours")
  @UseGuards(FormateurGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_SUPPORT_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_SUPPORT_MIMETYPES.includes(file.mimetype));
      },
    })
  )
  uploadSupport(
    @Headers("x-formateur-matricule") formateurMatricule: string,
    @Query("groupeCle") groupeCle: string,
    @Query("seanceNumero") seanceNumeroRaw: string | undefined,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!groupeCle) throw new BadRequestException("Groupe manquant.");
    if (!file) {
      throw new BadRequestException(
        "Fichier manquant, trop volumineux (100 Mo max) ou format non supporté (PDF, Word, PowerPoint, MP4, WEBM, MP3, WAV)."
      );
    }
    const seanceNumero = seanceNumeroRaw ? Number.parseInt(seanceNumeroRaw, 10) : null;
    return this.service.uploadSupport(formateurMatricule, groupeCle, seanceNumero, file);
  }

  @Get("supports-cours")
  @UseGuards(FormateurGuard)
  listSupportsForFormateur(
    @Headers("x-formateur-matricule") formateurMatricule: string,
    @Query("groupeCle") groupeCle: string
  ) {
    if (!groupeCle) throw new BadRequestException("Groupe manquant.");
    return this.service.listSupportsForFormateur(formateurMatricule, groupeCle);
  }

  @Get("supports-cours/:id")
  @UseGuards(FormateurGuard)
  async streamSupportForFormateur(
    @Headers("x-formateur-matricule") formateurMatricule: string,
    @Param("id") id: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getSupportStreamForFormateur(
      formateurMatricule,
      id
    );
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  @Delete("supports-cours/:id")
  @UseGuards(FormateurGuard)
  deleteSupport(
    @Headers("x-formateur-matricule") formateurMatricule: string,
    @Param("id") id: string
  ) {
    return this.service.deleteSupport(formateurMatricule, id);
  }

  // ---- Apprenant (pas de guard — même niveau de protection stopgap que le
  // reste du Compte Apprenant, matricule comme identifiant) ------------------

  @Get("apprenants/:matricule/supports-cours")
  listSupportsForApprenant(@Param("matricule") matricule: string) {
    return this.service.listSupportsForApprenant(matricule);
  }

  @Get("apprenants/:matricule/supports-cours/:id")
  async streamSupportForApprenant(
    @Param("matricule") matricule: string,
    @Param("id") id: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getSupportStreamForApprenant(matricule, id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }
}
