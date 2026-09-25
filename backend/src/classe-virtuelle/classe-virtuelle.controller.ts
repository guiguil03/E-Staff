import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FormateurGuard } from "../common/formateur.guard";
import { ApprenantGuard } from "../common/apprenant.guard";
import { ClasseVirtuelleService } from "./classe-virtuelle.service";
import { EnregistrementService } from "./enregistrement.service";
import { UpsertSeanceDto } from "./dto/upsert-seance.dto";

@ApiTags("Classes virtuelles")
@Controller()
export class ClasseVirtuelleController {
  constructor(
    private readonly service: ClasseVirtuelleService,
    private readonly enregistrements: EnregistrementService
  ) {}

  @Get("seances/:groupeCle/:numero")
  @UseGuards(FormateurGuard)
  getSeance(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.getSeance(groupeCle, numero, formateurMatricule);
  }

  @Put("seances/:groupeCle/:numero")
  @UseGuards(FormateurGuard)
  upsertSeance(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Body() dto: UpsertSeanceDto,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.upsertSeance(groupeCle, numero, dto, formateurMatricule);
  }

  @Delete("seances/:groupeCle/:numero")
  @UseGuards(FormateurGuard)
  cancelSeance(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.cancelSeance(groupeCle, numero, formateurMatricule);
  }

  @Get("seances/:groupeCle/:numero/room")
  @UseGuards(FormateurGuard)
  getSeanceRoom(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.getSeanceRoom(groupeCle, numero, formateurMatricule);
  }

  @Get("formateurs/prochaine-seance")
  @UseGuards(FormateurGuard)
  getFormateurProchaineSeance(@Headers("x-formateur-matricule") formateurMatricule: string) {
    return this.service.getFormateurProchaineSeance(formateurMatricule);
  }

  // Calendrier formateur — séances planifiées de ses groupes uniquement.
  @Get("seances")
  @UseGuards(FormateurGuard)
  listSeances(@Headers("x-formateur-matricule") formateurMatricule: string) {
    return this.service.listSeances(formateurMatricule);
  }

  // Historique des séances passées d'un groupe (horaire, rappels, présence).
  @Get("groupes/:groupeCle/historique")
  @UseGuards(FormateurGuard)
  getHistorique(
    @Param("groupeCle") groupeCle: string,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.service.getHistorique(groupeCle, formateurMatricule);
  }

  // Gardé par ApprenantGuard : la session doit correspondre exactement au
  // matricule de l'URL (voir apprenant.guard.ts).
  @UseGuards(ApprenantGuard)
  @Get("apprenants/:matricule/prochaine-seance-room")
  getApprenantProchaineSeanceRoom(@Param("matricule") matricule: string) {
    return this.service.getApprenantProchaineSeanceRoom(matricule);
  }

  // Calendrier apprenant — séances planifiées de son groupe.
  @UseGuards(ApprenantGuard)
  @Get("apprenants/:matricule/seances")
  listApprenantSeances(@Param("matricule") matricule: string) {
    return this.service.listApprenantSeances(matricule);
  }

  // ---- Enregistrements (revisionner une séance) ----------------------------

  @UseGuards(ApprenantGuard)
  @Get("apprenants/:matricule/enregistrements")
  listEnregistrementsApprenant(@Param("matricule") matricule: string) {
    return this.enregistrements.listPourApprenant(matricule);
  }

  @UseGuards(ApprenantGuard)
  @Get("apprenants/:matricule/enregistrements/:id/lien")
  lienEnregistrementApprenant(@Param("matricule") matricule: string, @Param("id") id: string) {
    return this.enregistrements.lienPourApprenant(matricule, id);
  }

  @Get("seances/:groupeCle/:numero/enregistrements")
  @UseGuards(FormateurGuard)
  listEnregistrementsFormateur(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.enregistrements.listPourFormateur(groupeCle, numero, formateurMatricule);
  }

  @Get("enregistrements/:id/lien")
  @UseGuards(FormateurGuard)
  lienEnregistrementFormateur(
    @Param("id") id: string,
    @Headers("x-formateur-matricule") formateurMatricule: string
  ) {
    return this.enregistrements.lienPourFormateur(id, formateurMatricule);
  }
}
