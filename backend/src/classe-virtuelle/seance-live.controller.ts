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
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { FormateurGuard } from "../common/formateur.guard";
import { ApprenantGuard } from "../common/apprenant.guard";
import { SeanceLiveService } from "./seance-live.service";

const MAX_IMAGE_TABLEAU_BYTES = 5 * 1024 * 1024; // 5 Mo
const MAX_SCENE_BYTES = 2 * 1024 * 1024; // 2 Mo

class SaveNoteDto {
  @IsString() @MaxLength(20000) contenu!: string;
  // Absent = note générale de la séance.
  @IsOptional() @IsString() apprenantMatricule?: string;
}

@ApiTags("Classes virtuelles")
@Controller()
export class SeanceLiveController {
  constructor(private readonly service: SeanceLiveService) {}

  // ---- Formateur ------------------------------------------------------------

  @Get("seances/:groupeCle/:numero/notes")
  @UseGuards(FormateurGuard)
  getNotes(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.getNotes(groupeCle, numero, formateurMatricule);
  }

  @Put("seances/:groupeCle/:numero/notes")
  @UseGuards(FormateurGuard)
  saveNote(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Body() dto: SaveNoteDto,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.saveNote(groupeCle, numero, formateurMatricule, dto.contenu, dto.apprenantMatricule);
  }

  @Get("seances/:groupeCle/:numero/tableau")
  @UseGuards(FormateurGuard)
  getTableau(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.getTableauFormateur(groupeCle, numero, formateurMatricule);
  }

  // Scène envoyée comme fichier JSON (multipart) plutôt qu'en corps JSON :
  // un tableau avec des tracés à main levée dépasse vite la limite globale
  // de 100 Ko du parseur JSON, qu'on ne relève pas pour tout le site.
  @Put("seances/:groupeCle/:numero/tableau")
  @UseGuards(FormateurGuard)
  @UseInterceptors(FileInterceptor("scene", { limits: { fileSize: MAX_SCENE_BYTES } }))
  saveTableau(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @UploadedFile() scene: Express.Multer.File,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    if (!scene) throw new BadRequestException("Scène manquante ou trop volumineuse (2 Mo max).");
    let elements: unknown;
    try {
      elements = JSON.parse(scene.buffer.toString("utf8"));
    } catch {
      throw new BadRequestException("Scène invalide.");
    }
    return this.service.saveTableau(groupeCle, numero, formateurMatricule, elements);
  }

  @Post("seances/:groupeCle/:numero/tableau/fichiers/:fileId")
  @UseGuards(FormateurGuard)
  @UseInterceptors(FileInterceptor("fichier", { limits: { fileSize: MAX_IMAGE_TABLEAU_BYTES } }))
  uploadFichier(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Param("fileId") fileId: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.uploadFichierTableau(groupeCle, numero, formateurMatricule, fileId, file);
  }

  @Get("seances/:groupeCle/:numero/tableau/fichiers/:fileId")
  @UseGuards(FormateurGuard)
  async getFichier(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Param("fileId") fileId: string,
    @Headers("x-formateur-matricule") formateurMatricule: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getFichierFormateur(groupeCle, numero, formateurMatricule, fileId);
    res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  // ---- Apprenant (lecture seule du tableau) --------------------------------

  @UseGuards(ApprenantGuard)
  @Get("apprenants/:matricule/seances/:numero/tableau")
  getTableauApprenant(
    @Param("matricule") matricule: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Query("depuis") depuis?: string
  ) {
    const version = depuis !== undefined && depuis !== "" ? Number.parseInt(depuis, 10) : undefined;
    return this.service.getTableauApprenant(matricule, numero, Number.isNaN(version) ? undefined : version);
  }

  @UseGuards(ApprenantGuard)
  @Get("apprenants/:matricule/seances/:numero/tableau/fichiers/:fileId")
  async getFichierApprenant(
    @Param("matricule") matricule: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Param("fileId") fileId: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getFichierApprenant(matricule, numero, fileId);
    res.set("Content-Type", contentType);
    stream.pipe(res);
  }
}
