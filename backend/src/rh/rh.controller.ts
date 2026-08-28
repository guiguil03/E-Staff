import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../common/admin.guard';
import { RhService } from './rh.service';
import { UpsertReunionDto } from './dto/upsert-reunion.dto';
import { UpdateConnecteurStatutDto } from './dto/update-connecteur-statut.dto';
import { UpsertFormateurDto } from './dto/upsert-formateur.dto';
import { AssignFormateurDto } from './dto/assign-formateur.dto';
import { UpdateTypeCoursDto } from './dto/update-type-cours.dto';
import { UpdateVagueDatesDto } from './dto/update-vague-dates.dto';

@Controller('rh')
@UseGuards(AdminGuard)
export class RhController {
  constructor(private readonly service: RhService) {}

  @Get('vue-ensemble')
  getVueEnsemble() {
    return this.service.getVueEnsemble();
  }

  @Get('registre')
  getRegistre() {
    return this.service.getRegistre();
  }

  @Get('partenaires')
  getPartenaires() {
    return this.service.getPartenaires();
  }

  @Put('partenaires/:id/statut')
  updatePartenaireStatut(
    @Param('id') id: string,
    @Body() dto: UpdateConnecteurStatutDto,
  ) {
    return this.service.updatePartenaireStatut(id, dto.status);
  }

  @Get('reunions')
  listReunions() {
    return this.service.listReunions();
  }

  @Post('reunions')
  createReunion(@Body() dto: UpsertReunionDto) {
    return this.service.createReunion(dto);
  }

  @Put('reunions/:id')
  updateReunion(@Param('id') id: string, @Body() dto: UpsertReunionDto) {
    return this.service.updateReunion(id, dto);
  }

  @Post('reunions/:id/annuler')
  cancelReunion(@Param('id') id: string) {
    return this.service.cancelReunion(id);
  }

  @Get('formateurs')
  listFormateurs() {
    return this.service.listFormateurs();
  }

  @Post('formateurs')
  createFormateur(@Body() dto: UpsertFormateurDto) {
    return this.service.createFormateur(dto);
  }

  @Put('formateurs/:id')
  updateFormateur(@Param('id') id: string, @Body() dto: UpsertFormateurDto) {
    return this.service.updateFormateur(id, dto);
  }

  @Put('groupes/:id/formateur')
  assignFormateur(@Param('id') id: string, @Body() dto: AssignFormateurDto) {
    return this.service.assignFormateur(id, dto.formateurId ?? null);
  }

  @Get('performance-formateurs')
  getPerformanceFormateurs() {
    return this.service.getPerformanceFormateurs();
  }

  @Put('groupes/:id/type-cours')
  updateGroupeTypeCours(@Param('id') id: string, @Body() dto: UpdateTypeCoursDto) {
    return this.service.updateGroupeTypeCours(id, dto.typeCours ?? null);
  }

  @Get('cycle-complet')
  getCycleComplet() {
    return this.service.getCycleComplet();
  }

  @Get('cycle/:attemptId')
  getPersonneCasier(@Param('attemptId') attemptId: string) {
    return this.service.getPersonneCasier(attemptId);
  }

  @Put('groupes/:id/dates')
  updateVagueDates(@Param('id') id: string, @Body() dto: UpdateVagueDatesDto) {
    return this.service.updateVagueDates(
      id,
      dto.dateDebut ? new Date(dto.dateDebut) : null,
      dto.dateFin ? new Date(dto.dateFin) : null,
    );
  }

  @Get('vagues')
  getVagues() {
    return this.service.getVagues();
  }

  @Get('apprenants/:matricule/casier')
  getApprenantCasier(@Param('matricule') matricule: string) {
    return this.service.getApprenantCasier(matricule);
  }

  @Get('formateurs/:id/casier')
  getFormateurCasier(@Param('id') id: string) {
    return this.service.getFormateurCasier(id);
  }

  @Get('partenaires/:id/casier')
  getPartenaireCasier(@Param('id') id: string) {
    return this.service.getPartenaireCasier(id);
  }

  @Get('alertes-administratives')
  getAlertesAdministratives() {
    return this.service.getAlertesAdministratives();
  }
}
