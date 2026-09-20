import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminGuard } from '../common/admin.guard';
import { RhGuard } from '../common/rh.guard';
import { StaffGuard } from '../common/staff.guard';
import { RhService } from './rh.service';
import { UpsertReunionDto } from './dto/upsert-reunion.dto';
import { UpdateConnecteurStatutDto } from './dto/update-connecteur-statut.dto';
import { UpsertFormateurDto } from './dto/upsert-formateur.dto';
import { AssignFormateurDto } from './dto/assign-formateur.dto';
import { UpdateTypeCoursDto } from './dto/update-type-cours.dto';
import { UpdateVagueDatesDto } from './dto/update-vague-dates.dto';
import { UpdateApprenantRhDto } from './dto/update-apprenant-rh.dto';
import { UpdateTarifFormationDto } from './dto/update-tarif-formation.dto';
import { CreateEncaissementDto } from './dto/create-encaissement.dto';
import { UpdateEncaissementDto } from './dto/update-encaissement.dto';
import { UpdatePaiementFormateurDto } from './dto/update-paiement-formateur.dto';
import { EnvoyerResultatsDto } from './dto/envoyer-resultats.dto';
import { CreateApprenantDto } from './dto/create-apprenant.dto';
import { CreateAgentAcquisitionDto } from './dto/create-agent-acquisition.dto';
import { RenouvelerAbonnementDto } from './dto/renouveler-abonnement.dto';

const MAX_CONTRAT_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 Mo
const ALLOWED_CONTRAT_MIMETYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Compte RH surchargé, ventilé en deux le 2026-09-18 : Admin garde la
// génération de comptes/identifiants (formateur, apprenant), les
// événements (réunions) et les rentrées (Vagues) — le reste (clients &
// contrats, finances, pilotage) passe à RhGuard. Pas de garde au niveau du
// contrôleur : chaque route porte désormais son propre guard.
@ApiTags('RH')
@Controller('rh')
export class RhController {
  constructor(private readonly service: RhService) {}

  @UseGuards(RhGuard)
  @Get('vue-ensemble')
  getVueEnsemble() {
    return this.service.getVueEnsemble();
  }

  @UseGuards(RhGuard)
  @Get('registre')
  getRegistre() {
    return this.service.getRegistre();
  }

  @UseGuards(RhGuard)
  @Get('partenaires')
  getPartenaires() {
    return this.service.getPartenaires();
  }

  @UseGuards(RhGuard)
  @Put('partenaires/:id/statut')
  updatePartenaireStatut(
    @Param('id') id: string,
    @Body() dto: UpdateConnecteurStatutDto,
  ) {
    return this.service.updatePartenaireStatut(id, dto.status);
  }

  // ---- Événements (réunions) — Admin --------------------------------------

  @UseGuards(AdminGuard)
  @Get('reunions')
  listReunions() {
    return this.service.listReunions();
  }

  @UseGuards(AdminGuard)
  @Post('reunions')
  createReunion(@Body() dto: UpsertReunionDto) {
    return this.service.createReunion(dto);
  }

  @UseGuards(AdminGuard)
  @Put('reunions/:id')
  updateReunion(@Param('id') id: string, @Body() dto: UpsertReunionDto) {
    return this.service.updateReunion(id, dto);
  }

  @UseGuards(AdminGuard)
  @Post('reunions/:id/annuler')
  cancelReunion(@Param('id') id: string) {
    return this.service.cancelReunion(id);
  }

  // ---- Formateurs : génération de comptes/identifiants — Admin -----------

  @UseGuards(AdminGuard)
  @Get('formateurs')
  listFormateurs() {
    return this.service.listFormateurs();
  }

  @UseGuards(AdminGuard)
  @Post('formateurs')
  createFormateur(@Body() dto: UpsertFormateurDto) {
    return this.service.createFormateur(dto);
  }

  @UseGuards(AdminGuard)
  @Put('formateurs/:id')
  updateFormateur(@Param('id') id: string, @Body() dto: UpsertFormateurDto) {
    return this.service.updateFormateur(id, dto);
  }

  @UseGuards(AdminGuard)
  @Post('formateurs/:id/regenerer-identifiants')
  regenerateFormateurCredentials(@Param('id') id: string) {
    return this.service.regenerateFormateurCredentials(id);
  }

  @UseGuards(AdminGuard)
  @Put('groupes/:id/formateur')
  assignFormateur(@Param('id') id: string, @Body() dto: AssignFormateurDto) {
    return this.service.assignFormateur(id, dto.formateurId ?? null);
  }

  @UseGuards(RhGuard)
  @Get('performance-formateurs')
  getPerformanceFormateurs() {
    return this.service.getPerformanceFormateurs();
  }

  @UseGuards(AdminGuard)
  @Put('groupes/:id/type-cours')
  updateGroupeTypeCours(@Param('id') id: string, @Body() dto: UpdateTypeCoursDto) {
    return this.service.updateGroupeTypeCours(id, dto.typeCours ?? null);
  }

  @UseGuards(RhGuard)
  @Get('cycle-complet')
  getCycleComplet() {
    return this.service.getCycleComplet();
  }

  @UseGuards(RhGuard)
  @Get('cycle/:attemptId')
  getPersonneCasier(@Param('attemptId') attemptId: string) {
    return this.service.getPersonneCasier(attemptId);
  }

  // ---- Rentrées (Vagues) — Admin -------------------------------------------

  @UseGuards(AdminGuard)
  @Put('groupes/:id/dates')
  updateVagueDates(@Param('id') id: string, @Body() dto: UpdateVagueDatesDto) {
    return this.service.updateVagueDates(
      id,
      dto.dateDebut ? new Date(dto.dateDebut) : null,
      dto.dateFin ? new Date(dto.dateFin) : null,
    );
  }

  @UseGuards(AdminGuard)
  @Get('vagues')
  getVagues() {
    return this.service.getVagues();
  }

  // ---- Apprenants : génération de compte (création) — Admin ---------------

  @UseGuards(AdminGuard)
  @Post('apprenants')
  createApprenant(@Body() dto: CreateApprenantDto) {
    return this.service.createApprenantAccount(dto);
  }

  // Pas une génération de compte (l'apprenant existe déjà) — gestion client
  // courante, RH.
  @UseGuards(RhGuard)
  @Post('apprenants/:matricule/renouveler')
  renouvelerAbonnement(
    @Param('matricule') matricule: string,
    @Body() dto: RenouvelerAbonnementDto,
  ) {
    return this.service.renouvelerAbonnement(matricule, dto);
  }

  // ---- Agents d'Acquisition (suivi commissions) -----------------------------

  @UseGuards(RhGuard)
  @Get('agents-acquisition')
  getSuiviAgentsAcquisition() {
    return this.service.getSuiviAgentsAcquisition();
  }

  @UseGuards(RhGuard)
  @Post('agents-acquisition')
  createAgentAcquisition(@Body() dto: CreateAgentAcquisitionDto) {
    return this.service.createAgentAcquisition(dto);
  }

  @UseGuards(RhGuard)
  @Get('apprenants/:matricule/casier')
  getApprenantCasier(@Param('matricule') matricule: string) {
    return this.service.getApprenantCasier(matricule);
  }

  @UseGuards(RhGuard)
  @Put('apprenants/:matricule')
  updateApprenantRh(
    @Param('matricule') matricule: string,
    @Body() dto: UpdateApprenantRhDto,
  ) {
    return this.service.updateApprenantRh(matricule, dto);
  }

  // Fiche formateur — consultée à la fois depuis Académie (Admin) et
  // potentiellement le pilotage RH : StaffGuard (voir en-tête du fichier).
  @UseGuards(StaffGuard)
  @Get('formateurs/:id/casier')
  getFormateurCasier(@Param('id') id: string) {
    return this.service.getFormateurCasier(id);
  }

  @UseGuards(StaffGuard)
  @Post('formateurs/:id/contrat')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_CONTRAT_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_CONTRAT_MIMETYPES.includes(file.mimetype));
      },
    }),
  )
  uploadFormateurContrat(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'Fichier manquant, trop volumineux (20 Mo max) ou format non supporté (PDF, Word).',
      );
    }
    return this.service.uploadFormateurContrat(id, file);
  }

  @UseGuards(StaffGuard)
  @Get('formateurs/documents/:documentId')
  async streamFormateurDocument(
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const { stream, contentType } = await this.service.getFormateurDocumentStream(documentId);
    if (contentType) res.set('Content-Type', contentType);
    stream.pipe(res);
  }

  @UseGuards(RhGuard)
  @Get('partenaires/:id/casier')
  getPartenaireCasier(@Param('id') id: string) {
    return this.service.getPartenaireCasier(id);
  }

  @UseGuards(RhGuard)
  @Get('alertes-administratives')
  getAlertesAdministratives() {
    return this.service.getAlertesAdministratives();
  }

  @UseGuards(RhGuard)
  @Post('cycle/:attemptId/envoyer-resultats')
  envoyerResultats(
    @Param('attemptId') attemptId: string,
    @Body() dto: EnvoyerResultatsDto,
  ) {
    return this.service.envoyerResultatsCandidat(attemptId, dto);
  }

  @UseGuards(RhGuard)
  @Get('coordonnees')
  getCoordonnees() {
    return this.service.getCoordonnees();
  }

  @UseGuards(RhGuard)
  @Get('etat-financier-formation')
  getEtatFinancierFormation() {
    return this.service.getEtatFinancierFormation();
  }

  @UseGuards(RhGuard)
  @Put('tarif-formation/:typeCours')
  updateTarifFormation(
    @Param('typeCours') typeCours: string,
    @Body() dto: UpdateTarifFormationDto,
  ) {
    return this.service.updateTarifFormation(typeCours, dto.prixFormation);
  }

  // ---- Encaissements formation (Facturation & Encaissement) — RH ----------

  @UseGuards(RhGuard)
  @Get('apprenants-pour-encaissement')
  listApprenantsPourEncaissement() {
    return this.service.listApprenantsPourEncaissement();
  }

  @UseGuards(RhGuard)
  @Get('encaissements')
  listEncaissements() {
    return this.service.listEncaissements();
  }

  @UseGuards(RhGuard)
  @Post('encaissements')
  createEncaissement(@Body() dto: CreateEncaissementDto) {
    return this.service.createEncaissement(dto);
  }

  @UseGuards(RhGuard)
  @Put('encaissements/:id')
  updateEncaissement(@Param('id') id: string, @Body() dto: UpdateEncaissementDto) {
    return this.service.updateEncaissement(id, dto);
  }

  @UseGuards(RhGuard)
  @Delete('encaissements/:id')
  deleteEncaissement(@Param('id') id: string) {
    return this.service.deleteEncaissement(id);
  }

  @UseGuards(RhGuard)
  @Get('encaissements-formation')
  getEncaissementsFormation() {
    return this.service.getEncaissementsFormation();
  }

  @UseGuards(RhGuard)
  @Get('encaissements/tendance-hebdomadaire')
  getTendanceHebdomadaireFormation() {
    return this.service.getTendanceHebdomadaireFormation();
  }

  @UseGuards(RhGuard)
  @Get('encaissements/tendance-mensuelle')
  getTendanceMensuelleFormation() {
    return this.service.getTendanceMensuelleFormation();
  }

  // ---- Paie Formateurs (Paie & Commissions) — RH ---------------------------

  @UseGuards(RhGuard)
  @Get('paie-formateurs')
  getTableauPaieFormateurs(@Query('periode') periode?: string) {
    return this.service.getTableauPaieFormateurs(periode);
  }

  @UseGuards(RhGuard)
  @Get('paie-formateurs/:bucket')
  getDetailPaieFormateurs(
    @Param('bucket') bucket: string,
    @Query('periode') periode?: string,
  ) {
    return this.service.getDetailPaieFormateurs(decodeURIComponent(bucket), periode);
  }

  @UseGuards(RhGuard)
  @Put('paie-formateurs/:formateurId/:periode')
  updatePaiementFormateur(
    @Param('formateurId') formateurId: string,
    @Param('periode') periode: string,
    @Body() dto: UpdatePaiementFormateurDto,
  ) {
    return this.service.updatePaiementFormateur(formateurId, periode, dto);
  }

  @UseGuards(RhGuard)
  @Post('paie-formateurs/:formateurId/:periode/payer')
  payerFormateur(
    @Param('formateurId') formateurId: string,
    @Param('periode') periode: string,
  ) {
    return this.service.payerFormateur(formateurId, periode);
  }

  @UseGuards(RhGuard)
  @Post('paie-formateurs/:bucket/payer-tout')
  payerTousFormateurs(
    @Param('bucket') bucket: string,
    @Query('periode') periode?: string,
  ) {
    return this.service.payerTousFormateurs(
      decodeURIComponent(bucket),
      periode ?? new Date().toISOString().slice(0, 7),
    );
  }
}
