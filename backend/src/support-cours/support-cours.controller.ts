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
import { diskStorage } from "multer";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { FormateurGuard } from "../common/formateur.guard";
import { ApprenantGuard } from "../common/apprenant.guard";
import { isAudio, isOfficeDocument, isVideo, readLeadingBytes } from "../common/file-signature";
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

// Signature binaire réelle, pas seulement le mimetype déclaré par le client
// (audit sécurité du 2026-10-08) — même principe que cockpit.controller.ts
// (isOfficeDocument) et media-wall.service.ts (isImage/isVideo). Sans ça,
// n'importe quel binaire pouvait être déposé comme "support de cours" et
// diffusé par e-mail à tout un groupe d'apprenants sous couvert de document
// pédagogique de confiance.
function matchesDeclaredSignature(mimetype: string, buffer: Buffer): boolean {
  if (mimetype.startsWith("audio/")) return isAudio(buffer);
  if (mimetype.startsWith("video/")) return isVideo(buffer);
  return isOfficeDocument(buffer);
}

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
      // Fichier temporaire sur disque plutôt que bufferisé en RAM (audit
      // scalabilité du 2026-10-08) : à 100 Mo max, plusieurs dépôts
      // simultanés en Buffer pouvaient épuiser la RAM du process. Voir
      // StorageService.uploadFile pour le flux vers S3 depuis ce chemin.
      storage: diskStorage({ destination: tmpdir() }),
      limits: { fileSize: MAX_SUPPORT_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_SUPPORT_MIMETYPES.includes(file.mimetype));
      },
    })
  )
  async uploadSupport(
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
    try {
      // Signature vérifiée sur les tout premiers octets du fichier
      // temporaire (readLeadingBytes), jamais en chargeant le fichier
      // entier en mémoire.
      const leading = await readLeadingBytes(file.path);
      if (!matchesDeclaredSignature(file.mimetype, leading)) {
        throw new BadRequestException("Le fichier déposé ne correspond pas au format déclaré.");
      }
      const seanceNumero = seanceNumeroRaw ? Number.parseInt(seanceNumeroRaw, 10) : null;
      return await this.service.uploadSupport(formateurMatricule, groupeCle, seanceNumero, file);
    } finally {
      // Toujours nettoyer le fichier temporaire — succès, échec de
      // validation, ou erreur du service, sinon le disque éphémère du
      // conteneur se remplit au fil des dépôts.
      await unlink(file.path).catch(() => {});
    }
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

  // ---- Apprenant — gardé par ApprenantGuard : la session doit correspondre
  // exactement au matricule de l'URL (voir apprenant.guard.ts). Ces routes
  // n'avaient aucune garde : n'importe qui devinant un matricule (séquentiel,
  // ETF-2026-0001...) pouvait lister et télécharger les supports d'un
  // groupe (corrigé le 2026-09-25). ------------------------------------------

  @UseGuards(ApprenantGuard)
  @Get("apprenants/:matricule/supports-cours")
  listSupportsForApprenant(@Param("matricule") matricule: string) {
    return this.service.listSupportsForApprenant(matricule);
  }

  @UseGuards(ApprenantGuard)
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
