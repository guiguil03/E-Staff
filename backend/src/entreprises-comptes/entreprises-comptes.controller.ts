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
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { RhGuard } from "../common/rh.guard";
import { EntrepriseGuard } from "../common/entreprise.guard";
import { AgentGuard } from "../common/agent.guard";
import { isOfficeDocument } from "../common/file-signature";
import { EntreprisesComptesService } from "./entreprises-comptes.service";
import { CreateEntrepriseDto } from "./dto/create-entreprise.dto";
import { RattacherContratDto } from "./dto/rattacher-contrat.dto";
import { ExprimerInteretDto } from "./dto/exprimer-interet.dto";
import { TraiterInteretDto } from "./dto/traiter-interet.dto";
import { AffecterLotDto } from "./dto/affecter-lot.dto";
import { PlanifierEntretienDto } from "./dto/planifier-entretien.dto";
import { EnvoyerMessageEntrepriseDto } from "./dto/envoyer-message-entreprise.dto";
import { UpsertEntrepriseLiveDto } from "./dto/upsert-entreprise-live.dto";
import { UpsertStandForumDto } from "./dto/upsert-stand-forum.dto";

const MAX_CONTRAT_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 Mo
const ALLOWED_CONTRAT_MIMETYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SUPPORT_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 Mo
const ALLOWED_SUPPORT_MIMETYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
];

// Espace Entreprise (client B2B) — trois familles de routes :
//   - RH (RhGuard) : annuaire, rattachement de contrats, dépôt du contrat
//     e-Staf, traitement des intérêts du vivier ;
//   - Entreprise (EntrepriseGuard) : routes `:matricule/...` ;
//   - public (sans garde) : lives et stands publiés, affichés sur
//     /communaute et /forum.
// Les routes littérales ("public/...", "interets/...") sont déclarées avant
// les routes paramétrées, même convention que superviseurs.controller.ts.
@ApiTags("Entreprises (comptes)")
@Controller("entreprises-comptes")
export class EntreprisesComptesController {
  constructor(private readonly service: EntreprisesComptesService) {}

  // ---- Public -----------------------------------------------------------------

  @Get("public/lives")
  listLivesPublics() {
    return this.service.listLivesPublics();
  }

  @Get("public/stands")
  listStandsPublics() {
    return this.service.listStandsPublics();
  }

  // ---- RH ---------------------------------------------------------------------

  @UseGuards(RhGuard)
  @Get()
  listEntreprises() {
    return this.service.listEntreprises();
  }

  @UseGuards(RhGuard)
  @Post()
  createEntreprise(@Body() dto: CreateEntrepriseDto) {
    return this.service.createEntreprise(dto);
  }

  // Supervision RH des entretiens planifiés par les entreprises (avec lien
  // d'accès à la salle). Routes littérales : aucune collision avec
  // `:matricule/entretiens` (deux segments, le second littéral).
  @UseGuards(RhGuard)
  @Get("entretiens")
  listEntretiensRh() {
    return this.service.listEntretiensRh();
  }

  @UseGuards(RhGuard)
  @Post("entretiens/:id/rejoindre")
  rejoindreEntretienRh(@Param("id") id: string) {
    return this.service.rejoindreEntretienRh(id);
  }

  @UseGuards(RhGuard)
  @Get("interets")
  listInterets(@Query("entrepriseId") entrepriseId?: string) {
    return this.service.listInterets(entrepriseId || undefined);
  }

  @UseGuards(RhGuard)
  @Post("interets/affecter-lot")
  affecterLot(@Body() dto: AffecterLotDto) {
    return this.service.affecterLot(dto);
  }

  @UseGuards(RhGuard)
  @Put("interets/:id")
  traiterInteret(@Param("id") id: string, @Body() dto: TraiterInteretDto) {
    return this.service.traiterInteret(id, dto);
  }

  @UseGuards(RhGuard)
  @Post(":id/regenerer-identifiants")
  regenererIdentifiants(@Param("id") id: string) {
    return this.service.regenererIdentifiants(id);
  }

  @UseGuards(RhGuard)
  @Post(":id/contrats")
  rattacherContrat(@Param("id") id: string, @Body() dto: RattacherContratDto) {
    return this.service.rattacherContrat(id, dto);
  }

  @UseGuards(RhGuard)
  @Delete("contrats/:contratId")
  detacherContrat(@Param("contratId") contratId: string) {
    return this.service.detacherContrat(contratId);
  }

  @UseGuards(RhGuard)
  @Post(":id/contrat")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_CONTRAT_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => cb(null, ALLOWED_CONTRAT_MIMETYPES.includes(file.mimetype)),
    })
  )
  uploadContrat(@Param("id") id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Fichier manquant, trop volumineux (20 Mo max) ou format non supporté (PDF, Word).");
    }
    if (!isOfficeDocument(file.buffer)) {
      throw new BadRequestException("Le fichier ne semble pas être un PDF ou Word valide.");
    }
    return this.service.uploadContrat(id, file);
  }

  // ---- Agent — supports de formation déposés par l'entreprise cliente ---------

  @UseGuards(AgentGuard)
  @Get("agents/:matricule/supports-formation")
  listSupportsFormationPourAgent(@Param("matricule") matricule: string) {
    return this.service.listSupportsFormationPourAgent(matricule);
  }

  @UseGuards(AgentGuard)
  @Get("agents/:matricule/supports-formation/:id")
  async streamSupportFormationPourAgent(
    @Param("matricule") matricule: string,
    @Param("id") id: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getSupportFormationStreamPourAgent(matricule, id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  // ---- Espace Entreprise --------------------------------------------------------

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/dashboard")
  getDashboard(@Param("matricule") matricule: string, @Query("contratId") contratId?: string) {
    return this.service.getDashboard(matricule, contratId || undefined);
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/mon-casier")
  getMonCasier(@Param("matricule") matricule: string) {
    return this.service.getMonCasier(matricule);
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/documents/:id")
  async streamDocument(@Param("matricule") matricule: string, @Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getDocumentStream(matricule, id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/factures/:id/pdf")
  async getFacturePdf(@Param("matricule") matricule: string, @Param("id") id: string, @Res() res: Response) {
    const pdf = await this.service.getFacturePdf(matricule, id);
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="facture-${id}.pdf"` });
    res.send(pdf);
  }

  // ---- Vivier de talents --------------------------------------------------------

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/vivier")
  listerVivier(@Param("matricule") matricule: string) {
    return this.service.listerVivier(matricule);
  }

  @UseGuards(EntrepriseGuard)
  @Post(":matricule/vivier/interets")
  exprimerInteret(@Param("matricule") matricule: string, @Body() dto: ExprimerInteretDto) {
    return this.service.exprimerInteret(matricule, dto);
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/vivier/interets")
  listMesInterets(@Param("matricule") matricule: string) {
    return this.service.listMesInterets(matricule);
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/vivier/interets/:id/bilan")
  getBilanPrisePoste(@Param("matricule") matricule: string, @Param("id") id: string) {
    return this.service.getBilanPrisePoste(matricule, id);
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/vivier/interets/:id/bilan/video")
  async getBilanVideo(@Param("matricule") matricule: string, @Param("id") id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getBilanVideoStream(matricule, id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  // Médias d'un profil du vivier (CV, vidéo de présentation, audios), avant
  // sélection pour un entretien — préfixe distinct de `vivier/interets/...`.
  @UseGuards(EntrepriseGuard)
  @Get(":matricule/vivier-medias/:type/:id")
  listMediasVivier(@Param("matricule") matricule: string, @Param("type") type: string, @Param("id") id: string) {
    return this.service.listMediasVivier(matricule, type, id);
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/vivier-medias/:type/:id/cv")
  async getCvVivier(
    @Param("matricule") matricule: string,
    @Param("type") type: string,
    @Param("id") id: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getCvVivierStream(matricule, type, id);
    res.set("Content-Type", contentType ?? "application/pdf");
    stream.pipe(res);
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/vivier-medias/:type/:id/video")
  async getVideoVivier(
    @Param("matricule") matricule: string,
    @Param("type") type: string,
    @Param("id") id: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getVideoVivierStream(matricule, type, id);
    res.set("Content-Type", contentType ?? "video/webm");
    stream.pipe(res);
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/vivier-medias/:type/:id/audio/:reponseId")
  async getAudioVivier(
    @Param("matricule") matricule: string,
    @Param("type") type: string,
    @Param("id") id: string,
    @Param("reponseId") reponseId: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getAudioVivierStream(matricule, type, id, reponseId);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  // ---- Salle d'entretien virtuel -------------------------------------------------

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/entretiens")
  listEntretiens(@Param("matricule") matricule: string) {
    return this.service.listEntretiens(matricule);
  }

  @UseGuards(EntrepriseGuard)
  @Post(":matricule/entretiens/:id/rejoindre")
  rejoindreEntretien(@Param("matricule") matricule: string, @Param("id") id: string) {
    return this.service.rejoindreEntretien(matricule, id);
  }

  @UseGuards(EntrepriseGuard)
  @Post(":matricule/entretiens")
  planifierEntretien(@Param("matricule") matricule: string, @Body() dto: PlanifierEntretienDto) {
    return this.service.planifierEntretien(matricule, dto);
  }

  // ---- Formation : supports déposés par l'entreprise -----------------------------

  @UseGuards(EntrepriseGuard)
  @Post(":matricule/supports-formation")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({ destination: tmpdir() }),
      limits: { fileSize: MAX_SUPPORT_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => cb(null, ALLOWED_SUPPORT_MIMETYPES.includes(file.mimetype)),
    })
  )
  async uploadSupportFormation(
    @Param("matricule") matricule: string,
    @Query("contratId") contratId: string | undefined,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException(
        "Fichier manquant, trop volumineux (100 Mo max) ou format non supporté (PDF, Word, PowerPoint, MP4, WEBM, MP3, WAV)."
      );
    }
    try {
      return await this.service.uploadSupportFormation(matricule, contratId || null, file);
    } finally {
      await unlink(file.path).catch(() => {});
    }
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/supports-formation")
  listSupportsFormation(@Param("matricule") matricule: string) {
    return this.service.listSupportsFormation(matricule);
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/supports-formation/:id")
  async streamSupportFormation(
    @Param("matricule") matricule: string,
    @Param("id") id: string,
    @Res() res: Response
  ) {
    const { stream, contentType } = await this.service.getSupportFormationStream(matricule, id);
    if (contentType) res.set("Content-Type", contentType);
    stream.pipe(res);
  }

  // ---- Échange avec le Superviseur ------------------------------------------------

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/messages")
  listMessages(@Param("matricule") matricule: string, @Query("contratId") contratId?: string) {
    return this.service.listMessages(matricule, contratId || undefined);
  }

  @UseGuards(EntrepriseGuard)
  @Post(":matricule/messages")
  envoyerMessage(@Param("matricule") matricule: string, @Body() dto: EnvoyerMessageEntrepriseDto) {
    return this.service.envoyerMessage(matricule, dto);
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/bilans-superviseur")
  listBilansSuperviseur(@Param("matricule") matricule: string, @Query("contratId") contratId?: string) {
    return this.service.listBilansSuperviseur(matricule, contratId || undefined);
  }

  // ---- Live & stand forum ---------------------------------------------------------

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/lives")
  listLives(@Param("matricule") matricule: string) {
    return this.service.listLives(matricule);
  }

  @UseGuards(EntrepriseGuard)
  @Post(":matricule/lives")
  creerLive(@Param("matricule") matricule: string, @Body() dto: UpsertEntrepriseLiveDto) {
    return this.service.creerLive(matricule, dto);
  }

  @UseGuards(EntrepriseGuard)
  @Delete(":matricule/lives/:id")
  annulerLive(@Param("matricule") matricule: string, @Param("id") id: string) {
    return this.service.annulerLive(matricule, id);
  }

  @UseGuards(EntrepriseGuard)
  @Post(":matricule/lives/:id/salle")
  salleLive(@Param("matricule") matricule: string, @Param("id") id: string) {
    return this.service.salleLive(matricule, id);
  }

  @UseGuards(EntrepriseGuard)
  @Get(":matricule/stand")
  getStand(@Param("matricule") matricule: string) {
    return this.service.getStand(matricule);
  }

  @UseGuards(EntrepriseGuard)
  @Put(":matricule/stand")
  upsertStand(@Param("matricule") matricule: string, @Body() dto: UpsertStandForumDto) {
    return this.service.upsertStand(matricule, dto);
  }
}
