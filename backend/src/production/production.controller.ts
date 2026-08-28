import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { AdminGuard } from "../common/admin.guard";
import { ProductionService } from "./production.service";
import { UpsertSuperviseurDto } from "./dto/upsert-superviseur.dto";
import { UpsertContratDto } from "./dto/upsert-contrat.dto";
import { CreateMissionDto } from "./dto/create-mission.dto";
import { UpdateMissionDto } from "./dto/update-mission.dto";
import { CreateFactureDto } from "./dto/create-facture.dto";
import { UpsertObjectifJournalierDto } from "./dto/upsert-objectif-journalier.dto";
import { UpsertSuiviAgentHebdoDto } from "./dto/upsert-suivi-agent-hebdo.dto";
import { UpsertRapportHebdoDto } from "./dto/upsert-rapport-hebdo.dto";
import { UpdateDecaissementDto } from "./dto/update-decaissement.dto";
import { UpdatePaiementAgentDto } from "./dto/update-paiement-agent.dto";
import { UpdatePerformanceSuperviseurClientDto } from "./dto/update-performance-superviseur-client.dto";
import { UpdatePaiementSuperviseurDto } from "./dto/update-paiement-superviseur.dto";
import { UpsertChargeInfrastructureDto } from "./dto/upsert-charge-infrastructure.dto";

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

  @Get("cartes-mission-client")
  getCartesMissionClient() {
    return this.service.getCartesMissionClient();
  }

  @Get("contrats/:id/modal")
  getContratModalData(@Param("id") id: string) {
    return this.service.getContratModalData(id);
  }

  @Put("contrats/:id/objectifs-journaliers")
  upsertObjectifJournalier(@Param("id") id: string, @Body() dto: UpsertObjectifJournalierDto) {
    return this.service.upsertObjectifJournalier(id, dto);
  }

  @Put("missions/:id/suivi-hebdo")
  upsertSuiviAgentHebdo(@Param("id") id: string, @Body() dto: UpsertSuiviAgentHebdoDto) {
    return this.service.upsertSuiviAgentHebdo(id, dto);
  }

  @Put("contrats/:id/rapports-hebdo")
  upsertRapportHebdo(@Param("id") id: string, @Body() dto: UpsertRapportHebdoDto) {
    return this.service.upsertRapportHebdo(id, dto);
  }

  @Get("tableau-financier-global")
  getTableauFinancierGlobal(@Query("periode") periode?: string) {
    return this.service.getTableauFinancierGlobal(periode);
  }

  @Get("detail-financier-par-client")
  getDetailFinancierParClient() {
    return this.service.getDetailFinancierParClient();
  }

  @Put("decaissements/:poste/:periode/montant-reel")
  updateDecaissementMontantReel(
    @Param("poste") poste: string,
    @Param("periode") periode: string,
    @Body() dto: UpdateDecaissementDto
  ) {
    return this.service.updateDecaissementMontantReel(poste, periode, dto);
  }

  @Post("decaissements/:poste/:periode/payer")
  payerDecaissement(@Param("poste") poste: string, @Param("periode") periode: string) {
    return this.service.payerDecaissement(poste, periode);
  }

  @Post("decaissements/payer-tout")
  payerTousDecaissements(@Query("periode") periode: string) {
    return this.service.payerTousDecaissements(periode);
  }

  @Get("detail-paie-agents")
  getDetailPaieAgents(@Query("periode") periode?: string) {
    return this.service.getDetailPaieAgents(periode);
  }

  @Put("paiements-agents/:missionId/:periode")
  updatePaiementAgent(
    @Param("missionId") missionId: string,
    @Param("periode") periode: string,
    @Body() dto: UpdatePaiementAgentDto
  ) {
    return this.service.updatePaiementAgent(missionId, periode, dto);
  }

  @Post("paiements-agents/:missionId/:periode/payer")
  payerAgent(@Param("missionId") missionId: string, @Param("periode") periode: string) {
    return this.service.payerAgent(missionId, periode);
  }

  @Get("detail-pool-superviseurs")
  getDetailPoolSuperviseurs(@Query("periode") periode?: string) {
    return this.service.getDetailPoolSuperviseurs(periode);
  }

  @Put("performances-superviseur-client/:id")
  updatePerformanceSuperviseurClient(
    @Param("id") id: string,
    @Body() dto: UpdatePerformanceSuperviseurClientDto
  ) {
    return this.service.updatePerformanceSuperviseurClient(id, dto);
  }

  @Put("paiements-superviseur/:superviseurId/:periode")
  updatePaiementSuperviseur(
    @Param("superviseurId") superviseurId: string,
    @Param("periode") periode: string,
    @Body() dto: UpdatePaiementSuperviseurDto
  ) {
    return this.service.updatePaiementSuperviseur(superviseurId, periode, dto);
  }

  @Post("paiements-superviseur/:superviseurId/:periode/payer")
  payerSuperviseur(
    @Param("superviseurId") superviseurId: string,
    @Param("periode") periode: string
  ) {
    return this.service.payerSuperviseur(superviseurId, periode);
  }

  @Get("etat-financier-par-client")
  getEtatFinancierProductionParClient() {
    return this.service.getEtatFinancierProductionParClient();
  }

  @Get("tendance-mensuelle")
  getTendanceMensuelleProduction() {
    return this.service.getTendanceMensuelleProduction();
  }

  @Get("commissions-apporteurs")
  getCommissionsApporteurs(@Query("periode") periode?: string) {
    return this.service.getCommissionsApporteurs(periode);
  }

  @Get("commissions-demarrage")
  getCommissionsDemarrage() {
    return this.service.getCommissionsDemarrage();
  }

  @Post("commissions-demarrage/:id/payer")
  payerCommissionDemarrage(@Param("id") id: string) {
    return this.service.payerCommissionDemarrage(id);
  }

  @Post("paiements-agents/payer-tout")
  payerTousLesAgents(@Query("periode") periode: string) {
    return this.service.payerTousLesAgents(periode);
  }

  @Get("charges-infrastructure")
  getChargesInfrastructure(@Query("periode") periode?: string) {
    return this.service.getChargesInfrastructure(periode);
  }

  @Post("charges-infrastructure")
  createChargeInfrastructure(@Body() dto: UpsertChargeInfrastructureDto) {
    return this.service.createChargeInfrastructure(dto);
  }

  @Put("charges-infrastructure/:id")
  updateChargeInfrastructure(
    @Param("id") id: string,
    @Body() dto: UpsertChargeInfrastructureDto
  ) {
    return this.service.updateChargeInfrastructure(id, dto);
  }

  @Post("charges-infrastructure/:id/payer")
  payerChargeInfrastructure(@Param("id") id: string) {
    return this.service.payerChargeInfrastructure(id);
  }

  @Post("charges-infrastructure/payer-tout")
  payerToutesChargesInfrastructure(@Query("periode") periode: string) {
    return this.service.payerToutesChargesInfrastructure(periode);
  }

  @Post("charges-infrastructure/:id/piece-justificative")
  @UseInterceptors(FileInterceptor("fichier"))
  uploadPieceJustificative(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.service.uploadPieceJustificative(id, file);
  }

  @Get("charges-infrastructure/:id/piece-justificative")
  async streamPieceJustificative(@Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getPieceJustificativeStream(id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }
}
