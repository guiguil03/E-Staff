import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { FormateurGuard } from "../common/formateur.guard";
import { CockpitService } from "./cockpit.service";
import { SetAbonnementDto } from "./dto/set-abonnement.dto";
import { SubmitBilanDto } from "./dto/submit-bilan.dto";
import { CreateDiffusionDto } from "./dto/create-diffusion.dto";

// Fiche de préparation = document pédagogique (support de cours), pas une
// vidéo/audio d'évaluation — mêmes types que le CV candidat plutôt que ceux
// de l'évaluation.
const MAX_DOCUMENT_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 Mo
const ALLOWED_DOCUMENT_MIMETYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

// Agrégats réels du Cockpit Formateur (Vivier C1, moyennes de groupe,
// courbe d'évolution, rapport hebdo) — voir cockpit.service.ts pour les
// conventions de calcul et ce qui reste volontairement hors périmètre
// (Alertes Paiements, en attente d'un modèle d'abonnement).
@ApiTags("Cockpit")
@Controller("cockpit")
@UseGuards(FormateurGuard)
export class CockpitController {
  constructor(private readonly service: CockpitService) {}

  @Get("groupes")
  getGroupes(@Headers("x-formateur-matricule") formateurMatricule: string) {
    return this.service.getGroupes(formateurMatricule);
  }

  @Get("groupes/:cle/detail")
  getGroupeDetail(
    @Param("cle") cle: string,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.getGroupeDetail(cle, formateurMatricule);
  }

  @Get("vivier-c1")
  getVivierC1() {
    return this.service.getVivierC1();
  }

  @Get("evolution")
  getEvolution() {
    return this.service.getEvolution();
  }

  @Get("rapport-hebdo")
  getRapportHebdo() {
    return this.service.getRapportHebdo();
  }

  @Post("bilan-hebdo")
  submitBilanHebdo(
    @Headers("x-formateur-matricule") formateurMatricule: string,
    @Body() dto: SubmitBilanDto
  ) {
    return this.service.submitBilanHebdo(formateurMatricule, dto);
  }

  @Post("documents")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_DOCUMENT_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_DOCUMENT_MIMETYPES.includes(file.mimetype));
      },
    })
  )
  uploadDocument(
    @Headers("x-formateur-matricule") formateurMatricule: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException(
        "Fichier manquant, trop volumineux (20 Mo max) ou format non supporté (PDF, Word, PowerPoint)."
      );
    }
    return this.service.uploadDocument(formateurMatricule, file);
  }

  @Get("documents")
  listDocuments(@Headers("x-formateur-matricule") formateurMatricule: string) {
    return this.service.listDocuments(formateurMatricule);
  }

  @Get("documents/:id")
  async streamDocument(
    @Headers("x-formateur-matricule") formateurMatricule: string,
    @Param("id") id: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getDocumentStream(formateurMatricule, id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  @Post("diffusions")
  createDiffusion(
    @Headers("x-formateur-matricule") formateurMatricule: string,
    @Body() dto: CreateDiffusionDto
  ) {
    return this.service.createDiffusion(formateurMatricule, dto.groupeId ?? null, dto.message);
  }

  @Get("diffusions")
  listAnnonces(@Headers("x-formateur-matricule") formateurMatricule: string) {
    return this.service.listAnnonces(formateurMatricule);
  }

  @Get("paiements")
  getPaiements() {
    return this.service.getPaiements();
  }

  @Put("apprenants/:matricule/abonnement")
  setAbonnement(@Param("matricule") matricule: string, @Body() dto: SetAbonnementDto) {
    return this.service.setAbonnementExpireAt(matricule, new Date(dto.expireAt));
  }
}
