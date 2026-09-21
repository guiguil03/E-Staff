import {
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
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { FormateurGuard } from "../common/formateur.guard";
import { ApprenantGuard } from "../common/apprenant.guard";
import { NotationService } from "./notation.service";
import { GradeNotationDto } from "./dto/grade-notation.dto";

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
