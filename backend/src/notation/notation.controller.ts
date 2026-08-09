import {
  Body,
  Controller,
  Get,
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
import type { Response } from "express";
import { FormateurGuard } from "../common/formateur.guard";
import { NotationService } from "./notation.service";
import { GradeNotationDto } from "./dto/grade-notation.dto";

@Controller()
export class NotationController {
  constructor(private readonly service: NotationService) {}

  // ---- Formateur -----------------------------------------------------------

  @Get("notations/a-corriger")
  @UseGuards(FormateurGuard)
  listACorriger() {
    return this.service.listACorriger();
  }

  @Get("notations/:id/devoir")
  @UseGuards(FormateurGuard)
  async streamDevoir(@Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getDevoirStream(id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  @Get("notations/:groupeCle/:numero")
  @UseGuards(FormateurGuard)
  listNotationsForSeance(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number
  ) {
    return this.service.listNotationsForSeance(groupeCle, numero);
  }

  @Get("notations/:groupeCle/:numero/:apprenantMatricule/:competence")
  @UseGuards(FormateurGuard)
  getNotation(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Param("apprenantMatricule") apprenantMatricule: string,
    @Param("competence") competence: string
  ) {
    return this.service.getNotation(groupeCle, numero, apprenantMatricule, competence);
  }

  @Put("notations/:groupeCle/:numero/:apprenantMatricule/:competence")
  @UseGuards(FormateurGuard)
  gradeNotation(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Param("apprenantMatricule") apprenantMatricule: string,
    @Param("competence") competence: string,
    @Body() dto: GradeNotationDto
  ) {
    return this.service.gradeNotation(groupeCle, numero, apprenantMatricule, competence, dto);
  }

  // ---- Apprenant (pas de guard — même niveau de protection stopgap que le
  // reste du Compte Apprenant, matricule comme identifiant) ------------------

  @Get("apprenants/:matricule/notations")
  listApprenantNotations(@Param("matricule") matricule: string) {
    return this.service.listApprenantNotations(matricule);
  }

  @Get("apprenants/:matricule/notations/:numero/:competence")
  getApprenantNotationDetail(
    @Param("matricule") matricule: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Param("competence") competence: string
  ) {
    return this.service.getApprenantNotationDetail(matricule, numero, competence);
  }

  @Post("apprenants/:matricule/notations/:numero/:competence/devoir")
  @UseInterceptors(FileInterceptor("fichier"))
  uploadDevoir(
    @Param("matricule") matricule: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Param("competence") competence: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.service.uploadDevoir(matricule, numero, competence, file);
  }
}
