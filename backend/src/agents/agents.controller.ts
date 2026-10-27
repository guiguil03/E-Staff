import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
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
import { AgentGuard } from "../common/agent.guard";
import { RhGuard } from "../common/rh.guard";
import { StaffGuard } from "../common/staff.guard";
import { isOfficeDocument } from "../common/file-signature";
import { AgentsService } from "./agents.service";
import { UpsertAgentDto } from "./dto/upsert-agent.dto";
import { LierCandidatDto } from "./dto/lier-candidat.dto";
import { NoteClientDto } from "./dto/note-client.dto";
import { SaisieJourneeDto } from "./dto/saisie-journee.dto";
import { SignalerAssistanceDto } from "./dto/signaler-assistance.dto";
import { StatutPresenceDto } from "./dto/statut-presence.dto";
import { UpsertSuiviJournalierDto } from "./dto/upsert-suivi-journalier.dto";
import { ValiderJourneeDto } from "./dto/valider-journee.dto";

// Mêmes limites que le contrat formateur déposé par la RH (voir
// rh.controller.ts) — un contrat de travail est un PDF ou un Word.
const MAX_CONTRAT_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 Mo
const ALLOWED_CONTRAT_MIMETYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Deux faces, deux gardes (pas de garde au niveau du contrôleur) :
//
//   - gestion des comptes agents : RhGuard, comme le reste de la Production
//     (voir production.controller.ts) — routes indexées par `id` ;
//   - Espace Agent : AgentGuard, qui exige une session agent dont le
//     matricule est exactement celui de l'URL — routes `:matricule/...`.
//
// Les deux familles de routes ne se recouvrent pas (dernier segment
// distinct), et les routes littérales sont déclarées avant les
// paramétrées : Express prend la première qui correspond.
@ApiTags("Agents")
@Controller("agents")
export class AgentsController {
  constructor(private readonly service: AgentsService) {}

  // ---- Gestion des comptes (Portail RH > Agents) ---------------------------

  @UseGuards(RhGuard)
  @Get()
  listAgents() {
    return this.service.listAgents();
  }

  @UseGuards(RhGuard)
  @Post()
  createAgent(@Body() dto: UpsertAgentDto) {
    return this.service.createAgent(dto);
  }

  // Téléchargement d'un document depuis le Casier (RH) — déclarée avant les
  // routes `:matricule/...` et `:id/...` pour que "documents" ne soit pas lu
  // comme un identifiant.
  @UseGuards(StaffGuard)
  @Get("documents/:documentId")
  async streamDocument(@Param("documentId") documentId: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getDocumentStream(documentId);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  // Saisie du relevé journalier d'un agent (RH/superviseur) — rattachée à
  // la mission, pas à l'agent : c'est la production réalisée chez un client
  // précis.
  @UseGuards(RhGuard)
  @Put("missions/:missionId/suivi-journalier")
  upsertSuiviJournalier(
    @Param("missionId") missionId: string,
    @Body() dto: UpsertSuiviJournalierDto
  ) {
    return this.service.upsertSuiviJournalier(missionId, dto);
  }

  @UseGuards(RhGuard)
  @Delete("suivi-journalier/:id")
  supprimerSuiviJournalier(@Param("id") id: string) {
    return this.service.supprimerSuiviJournalier(id);
  }

  // Validation / réouverture d'une journée saisie par l'agent. Le
  // superviseur n'a pas de compte : c'est la RH qui valide à sa place, avec
  // une note facultative.
  @UseGuards(RhGuard)
  @Put("suivi-journalier/:id/validation")
  validerJournee(@Param("id") id: string, @Body() dto: ValiderJourneeDto) {
    return this.service.validerJournee(id, dto);
  }

  @UseGuards(RhGuard)
  @Put("suivi-journalier/:id/reouverture")
  rouvrirJournee(@Param("id") id: string) {
    return this.service.rouvrirJournee(id);
  }

  @UseGuards(RhGuard)
  @Post("missions/:missionId/notes-client")
  ajouterNoteClient(@Param("missionId") missionId: string, @Body() dto: NoteClientDto) {
    return this.service.ajouterNoteClient(missionId, dto);
  }

  @UseGuards(RhGuard)
  @Delete("notes-client/:id")
  supprimerNoteClient(@Param("id") id: string) {
    return this.service.supprimerNoteClient(id);
  }

  @UseGuards(RhGuard)
  @Post(":id/salle-brief-rh")
  salleBriefRh(@Param("id") id: string) {
    return this.service.salleBriefRh(id);
  }

  @UseGuards(RhGuard)
  @Put(":id/candidat")
  lierCandidat(@Param("id") id: string, @Body() dto: LierCandidatDto) {
    return this.service.lierCandidat(id, dto.email);
  }

  @UseGuards(RhGuard)
  @Delete(":id/candidat")
  delierCandidat(@Param("id") id: string) {
    return this.service.delierCandidat(id);
  }

  // ---- Espace Agent (session agent) ----------------------------------------

  @UseGuards(AgentGuard)
  @Post(":matricule/alerte")
  signalerAssistance(@Param("matricule") matricule: string, @Body() dto: SignalerAssistanceDto) {
    return this.service.signalerAssistance(matricule, dto.message);
  }

  @UseGuards(AgentGuard)
  @Post(":matricule/reunions/:reunionId/salle")
  salleReunion(@Param("matricule") matricule: string, @Param("reunionId") reunionId: string) {
    return this.service.salleReunionAgent(matricule, reunionId);
  }

  @UseGuards(AgentGuard)
  @Post(":matricule/salle-brief")
  salleBriefAgent(@Param("matricule") matricule: string) {
    return this.service.salleBriefAgent(matricule);
  }

  @UseGuards(AgentGuard)
  @Get(":matricule/mon-casier")
  getMonCasier(@Param("matricule") matricule: string) {
    return this.service.getMonCasier(matricule);
  }

  @UseGuards(AgentGuard)
  @Get(":matricule/suivi-activite")
  getSuiviActivite(@Param("matricule") matricule: string) {
    return this.service.getSuiviActivite(matricule);
  }

  @UseGuards(AgentGuard)
  @Put(":matricule/suivi-activite")
  saisirMaJournee(@Param("matricule") matricule: string, @Body() dto: SaisieJourneeDto) {
    return this.service.saisirMaJournee(matricule, dto);
  }

  @UseGuards(AgentGuard)
  @Post(":matricule/appels/demarrer")
  demarrerAppel(@Param("matricule") matricule: string) {
    return this.service.demarrerAppel(matricule);
  }

  @UseGuards(AgentGuard)
  @Post(":matricule/appels/terminer")
  terminerAppel(@Param("matricule") matricule: string) {
    return this.service.terminerAppel(matricule);
  }

  @UseGuards(AgentGuard)
  @Put(":matricule/statut-presence")
  changerStatutPresence(@Param("matricule") matricule: string, @Body() dto: StatutPresenceDto) {
    return this.service.changerStatutPresence(matricule, dto.statut);
  }

  @UseGuards(AgentGuard)
  @Get(":matricule/dashboard")
  getDashboard(@Param("matricule") matricule: string) {
    return this.service.getDashboard(matricule);
  }

  @UseGuards(AgentGuard)
  @Get(":matricule/dossier")
  getDossier(@Param("matricule") matricule: string) {
    return this.service.getDossier(matricule);
  }

  @UseGuards(AgentGuard)
  @Get(":matricule/paiements")
  getPaiements(@Param("matricule") matricule: string) {
    return this.service.getPaiements(matricule);
  }

  // L'agent télécharge son propre contrat : le document doit lui
  // appartenir (vérifié dans le service).
  @UseGuards(AgentGuard)
  @Get(":matricule/documents/:documentId")
  async streamMonDocument(
    @Param("matricule") matricule: string,
    @Param("documentId") documentId: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getMonDocumentStream(
      matricule,
      documentId
    );
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  // ---- Gestion d'un agent précis (RH) --------------------------------------

  @UseGuards(RhGuard)
  @Get(":id/casier")
  getAgentCasier(@Param("id") id: string) {
    return this.service.getAgentCasier(id);
  }

  @UseGuards(RhGuard)
  @Put(":id")
  updateAgent(@Param("id") id: string, @Body() dto: UpsertAgentDto) {
    return this.service.updateAgent(id, dto);
  }

  @UseGuards(RhGuard)
  @Delete(":id")
  removeAgent(@Param("id") id: string) {
    return this.service.removeAgent(id);
  }

  @UseGuards(RhGuard)
  @Post(":id/regenerer-identifiants")
  regenerateCredentials(@Param("id") id: string) {
    return this.service.regenerateCredentials(id);
  }

  @UseGuards(RhGuard)
  @Post(":id/contrat")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_CONTRAT_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_CONTRAT_MIMETYPES.includes(file.mimetype));
      },
    })
  )
  uploadContrat(@Param("id") id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        "Fichier manquant, trop volumineux (20 Mo max) ou format non supporté (PDF, Word)."
      );
    }
    if (!isOfficeDocument(file.buffer)) {
      throw new BadRequestException("Le fichier ne semble pas être un PDF ou Word valide.");
    }
    return this.service.uploadContrat(id, file);
  }
}
