import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RhGuard } from "../common/rh.guard";
import { SuperviseurGuard } from "../common/superviseur.guard";
import { ValiderJourneeDto } from "../agents/dto/valider-journee.dto";
import { AbsenceSuperviseurDto } from "./dto/absence-superviseur.dto";
import { EnvoyerMessageDto } from "./dto/envoyer-message.dto";
import { PlanifierReunionDto } from "./dto/planifier-reunion.dto";
import { SuperviseursService } from "./superviseurs.service";

// Deux faces, deux gardes (même découpage que agents.controller.ts) :
//   - Espace Superviseur : SuperviseurGuard, session dont le matricule est
//     celui de l'URL — routes `:matricule/...` ;
//   - gestion RH (identifiants, absences) : RhGuard — routes `:id/...`.
// Les dernières parties de chemin des deux familles ne se recouvrent pas ;
// les routes littérales sont déclarées avant les paramétrées.
@ApiTags("Superviseurs")
@Controller("superviseurs")
export class SuperviseursController {
  constructor(private readonly service: SuperviseursService) {}

  // ---- RH ---------------------------------------------------------------------

  @UseGuards(RhGuard)
  @Delete("absences/:absenceId")
  supprimerAbsence(@Param("absenceId") absenceId: string) {
    return this.service.supprimerAbsence(absenceId);
  }

  @UseGuards(RhGuard)
  @Post(":id/regenerer-identifiants")
  regenererIdentifiants(@Param("id") id: string) {
    return this.service.regenererIdentifiants(id);
  }

  @UseGuards(RhGuard)
  @Get(":id/absences")
  listAbsences(@Param("id") id: string) {
    return this.service.listAbsences(id);
  }

  @UseGuards(RhGuard)
  @Post(":id/absences")
  ajouterAbsence(@Param("id") id: string, @Body() dto: AbsenceSuperviseurDto) {
    return this.service.ajouterAbsence(id, dto);
  }

  // ---- Espace Superviseur ------------------------------------------------------

  @UseGuards(SuperviseurGuard)
  @Get(":matricule/dashboard")
  getDashboard(@Param("matricule") matricule: string, @Query("contratId") contratId?: string) {
    return this.service.getDashboard(matricule, contratId || undefined);
  }

  @UseGuards(SuperviseurGuard)
  @Get(":matricule/mon-casier")
  getMonCasier(@Param("matricule") matricule: string) {
    return this.service.getMonCasier(matricule);
  }

  @UseGuards(SuperviseurGuard)
  @Get(":matricule/reporting")
  @Header("Content-Type", "text/csv; charset=utf-8")
  rapportClient(
    @Param("matricule") matricule: string,
    @Query("periode") periode: string,
    @Query("contratId") contratId?: string
  ) {
    return this.service.rapportClientCsv(matricule, periode, contratId || undefined);
  }

  @UseGuards(SuperviseurGuard)
  @Put(":matricule/journees/:id/validation")
  validerJournee(
    @Param("matricule") matricule: string,
    @Param("id") id: string,
    @Body() dto: ValiderJourneeDto
  ) {
    return this.service.validerJournee(matricule, id, dto);
  }

  @UseGuards(SuperviseurGuard)
  @Put(":matricule/journees/:id/renvoi")
  renvoyerJournee(
    @Param("matricule") matricule: string,
    @Param("id") id: string,
    @Body() dto: ValiderJourneeDto
  ) {
    return this.service.renvoyerJournee(matricule, id, dto);
  }

  @UseGuards(SuperviseurGuard)
  @Put(":matricule/journees/:id/reouverture")
  rouvrirJournee(@Param("matricule") matricule: string, @Param("id") id: string) {
    return this.service.rouvrirJournee(matricule, id);
  }

  @UseGuards(SuperviseurGuard)
  @Post(":matricule/alertes/:id/traiter")
  traiterAlerte(@Param("matricule") matricule: string, @Param("id") id: string) {
    return this.service.traiterAlerte(matricule, id);
  }

  @UseGuards(SuperviseurGuard)
  @Post(":matricule/messages")
  envoyerMessage(@Param("matricule") matricule: string, @Body() dto: EnvoyerMessageDto) {
    return this.service.envoyerMessage(matricule, dto);
  }

  @UseGuards(SuperviseurGuard)
  @Post(":matricule/reunions")
  planifierReunion(@Param("matricule") matricule: string, @Body() dto: PlanifierReunionDto) {
    return this.service.planifierReunion(matricule, dto);
  }

  @UseGuards(SuperviseurGuard)
  @Delete(":matricule/reunions/:id")
  annulerReunion(@Param("matricule") matricule: string, @Param("id") id: string) {
    return this.service.annulerReunion(matricule, id);
  }

  @UseGuards(SuperviseurGuard)
  @Post(":matricule/reunions/:id/salle")
  salleReunion(@Param("matricule") matricule: string, @Param("id") id: string) {
    return this.service.salleReunion(matricule, id);
  }
}
