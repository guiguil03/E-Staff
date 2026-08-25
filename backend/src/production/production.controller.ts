import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../common/admin.guard";
import { ProductionService } from "./production.service";
import { UpsertSuperviseurDto } from "./dto/upsert-superviseur.dto";
import { UpsertContratDto } from "./dto/upsert-contrat.dto";
import { CreateMissionDto } from "./dto/create-mission.dto";
import { UpdateMissionDto } from "./dto/update-mission.dto";
import { CreateFactureDto } from "./dto/create-facture.dto";

@Controller("production")
@UseGuards(AdminGuard)
export class ProductionController {
  constructor(private readonly service: ProductionService) {}

  @Get("superviseurs")
  listSuperviseurs() {
    return this.service.listSuperviseurs();
  }

  @Post("superviseurs")
  createSuperviseur(@Body() dto: UpsertSuperviseurDto) {
    return this.service.createSuperviseur(dto);
  }

  @Put("superviseurs/:id")
  updateSuperviseur(@Param("id") id: string, @Body() dto: UpsertSuperviseurDto) {
    return this.service.updateSuperviseur(id, dto);
  }

  @Get("superviseurs/:id/casier")
  getSuperviseurCasier(@Param("id") id: string) {
    return this.service.getSuperviseurCasier(id);
  }

  @Get("contrats")
  listContrats() {
    return this.service.listContrats();
  }

  @Post("contrats")
  createContrat(@Body() dto: UpsertContratDto) {
    return this.service.createContrat(dto);
  }

  @Put("contrats/:id")
  updateContrat(@Param("id") id: string, @Body() dto: UpsertContratDto) {
    return this.service.updateContrat(id, dto);
  }

  @Get("contrats/:id/casier")
  getContratCasier(@Param("id") id: string) {
    return this.service.getContratCasier(id);
  }

  @Get("missions")
  listMissions() {
    return this.service.listMissions();
  }

  @Post("missions")
  createMission(@Body() dto: CreateMissionDto) {
    return this.service.createMission(dto);
  }

  @Put("missions/:id")
  updateMission(@Param("id") id: string, @Body() dto: UpdateMissionDto) {
    return this.service.updateMission(id, dto);
  }

  @Get("apprenants-disponibles")
  listApprenantsDisponibles() {
    return this.service.listApprenantsDisponibles();
  }

  @Get("performance-superviseurs")
  getPerformanceSuperviseurs() {
    return this.service.getPerformanceSuperviseurs();
  }

  @Get("vue-ensemble")
  getVueEnsembleProduction() {
    return this.service.getVueEnsembleProduction();
  }

  @Get("factures")
  listFactures() {
    return this.service.listFactures();
  }

  @Post("factures")
  createFacture(@Body() dto: CreateFactureDto) {
    return this.service.createFacture(dto);
  }

  @Post("factures/:id/payee")
  marquerFacturePayee(@Param("id") id: string) {
    return this.service.marquerFacturePayee(id);
  }

  @Get("tableau-financier")
  getTableauFinancier() {
    return this.service.getTableauFinancier();
  }
}
