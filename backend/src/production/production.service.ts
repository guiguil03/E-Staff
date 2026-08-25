import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertSuperviseurDto } from "./dto/upsert-superviseur.dto";
import { UpsertContratDto } from "./dto/upsert-contrat.dto";
import { CreateMissionDto } from "./dto/create-mission.dto";
import { UpdateMissionDto } from "./dto/update-mission.dto";
import { CreateFactureDto } from "./dto/create-facture.dto";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Superviseurs ---------------------------------------------------------

  listSuperviseurs() {
    return this.prisma.superviseur.findMany({
      include: { missions: { where: { dateFin: null } } },
      orderBy: { nom: "asc" },
    });
  }

  async createSuperviseur(dto: UpsertSuperviseurDto) {
    const existing = await this.prisma.superviseur.findUnique({
      where: { matricule: dto.matricule },
    });
    if (existing) {
      throw new BadRequestException(
        `Un superviseur avec le matricule "${dto.matricule}" existe déjà.`
      );
    }
    return this.prisma.superviseur.create({ data: dto });
  }

  async updateSuperviseur(id: string, dto: UpsertSuperviseurDto) {
    const existing = await this.prisma.superviseur.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Superviseur introuvable.");
    if (dto.matricule !== existing.matricule) {
      const conflict = await this.prisma.superviseur.findUnique({
        where: { matricule: dto.matricule },
      });
      if (conflict) {
        throw new BadRequestException(
          `Un superviseur avec le matricule "${dto.matricule}" existe déjà.`
        );
      }
    }
    return this.prisma.superviseur.update({ where: { id }, data: dto });
  }

  async getSuperviseurCasier(id: string) {
    const superviseur = await this.prisma.superviseur.findUnique({
      where: { id },
      include: {
        missions: {
          include: { apprenant: true, contrat: true },
          orderBy: { dateDebut: "desc" },
        },
      },
    });
    if (!superviseur) throw new NotFoundException("Superviseur introuvable.");

    return {
      matricule: superviseur.matricule,
      prenom: superviseur.prenom,
      nom: superviseur.nom,
      email: superviseur.email,
      missions: superviseur.missions.map((m) => ({
        agentNom: `${m.apprenant.prenom} ${m.apprenant.nom}`,
        agentMatricule: m.apprenant.matricule,
        clientNom: m.contrat.clientNom,
        role: m.role,
        dateDebut: m.dateDebut,
        dateFin: m.dateFin,
        qualityScore: m.qualityScore,
      })),
    };
  }

  // ---- Contrats B2B -----------------------------------------------------------

  listContrats() {
    return this.prisma.contratB2B.findMany({
      include: { _count: { select: { missions: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  createContrat(dto: UpsertContratDto) {
    return this.prisma.contratB2B.create({
      data: {
        clientNom: dto.clientNom,
        entrepriseProjetId: dto.entrepriseProjetId,
        description: dto.description,
        dateDebut: new Date(dto.dateDebut),
        dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
        statut: dto.statut ?? "actif",
        tarifMensuel: dto.tarifMensuel ?? null,
      },
    });
  }

  async updateContrat(id: string, dto: UpsertContratDto) {
    const existing = await this.prisma.contratB2B.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Contrat introuvable.");
    return this.prisma.contratB2B.update({
      where: { id },
      data: {
        clientNom: dto.clientNom,
        entrepriseProjetId: dto.entrepriseProjetId,
        description: dto.description,
        dateDebut: new Date(dto.dateDebut),
        dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
        statut: dto.statut ?? existing.statut,
        tarifMensuel: dto.tarifMensuel ?? existing.tarifMensuel,
      },
    });
  }

  async getContratCasier(id: string) {
    const contrat = await this.prisma.contratB2B.findUnique({
      where: { id },
      include: {
        missions: {
          include: { apprenant: true, superviseur: true },
          orderBy: { dateDebut: "desc" },
        },
        factures: { orderBy: { dateEmission: "desc" } },
      },
    });
    if (!contrat) throw new NotFoundException("Contrat introuvable.");

    const totalFacture = round2(contrat.factures.reduce((sum, f) => sum + f.montant, 0));
    const totalPaye = round2(
      contrat.factures.filter((f) => f.statut === "payee").reduce((sum, f) => sum + f.montant, 0)
    );

    return {
      clientNom: contrat.clientNom,
      description: contrat.description,
      dateDebut: contrat.dateDebut,
      dateFin: contrat.dateFin,
      statut: contrat.statut,
      tarifMensuel: contrat.tarifMensuel,
      totalFacture,
      totalPaye,
      totalEnAttente: round2(totalFacture - totalPaye),
      missions: contrat.missions.map((m) => ({
        agentNom: `${m.apprenant.prenom} ${m.apprenant.nom}`,
        agentMatricule: m.apprenant.matricule,
        role: m.role,
        dateDebut: m.dateDebut,
        dateFin: m.dateFin,
        superviseurNom: m.superviseur ? `${m.superviseur.prenom} ${m.superviseur.nom}` : null,
        qualityScore: m.qualityScore,
      })),
      factures: contrat.factures.map((f) => ({
        periode: f.periode,
        montant: f.montant,
        statut: f.statut,
        dateEmission: f.dateEmission,
        datePaiement: f.datePaiement,
      })),
    };
  }

  // ---- Missions (agents en production) ---------------------------------------

  listMissions() {
    return this.prisma.mission.findMany({
      include: { apprenant: true, contrat: true, superviseur: true },
      orderBy: { dateDebut: "desc" },
    });
  }

  async createMission(dto: CreateMissionDto) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { id: dto.apprenantId },
    });
    if (!apprenant) throw new NotFoundException("Apprenant introuvable.");
    const contrat = await this.prisma.contratB2B.findUnique({ where: { id: dto.contratId } });
    if (!contrat) throw new NotFoundException("Contrat introuvable.");
    if (dto.superviseurId) {
      const superviseur = await this.prisma.superviseur.findUnique({
        where: { id: dto.superviseurId },
      });
      if (!superviseur) throw new NotFoundException("Superviseur introuvable.");
    }

    // Un apprenant ne peut avoir qu'une mission active (dateFin=null) à la
    // fois — clôturer l'ancienne avant d'en créer une nouvelle plutôt que
    // de laisser un agent apparaître staffé sur deux contrats en même temps.
    const missionActive = await this.prisma.mission.findFirst({
      where: { apprenantId: dto.apprenantId, dateFin: null },
    });
    if (missionActive) {
      throw new BadRequestException(
        "Cet apprenant a déjà une mission active — clôturez-la avant d'en créer une nouvelle."
      );
    }

    return this.prisma.mission.create({
      data: {
        apprenantId: dto.apprenantId,
        contratId: dto.contratId,
        superviseurId: dto.superviseurId,
        role: dto.role,
        dateDebut: new Date(dto.dateDebut),
      },
      include: { apprenant: true, contrat: true, superviseur: true },
    });
  }

  async updateMission(id: string, dto: UpdateMissionDto) {
    const existing = await this.prisma.mission.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Mission introuvable.");
    return this.prisma.mission.update({
      where: { id },
      data: {
        superviseurId: dto.superviseurId === undefined ? undefined : dto.superviseurId,
        role: dto.role,
        dateFin: dto.dateFin === undefined ? undefined : dto.dateFin ? new Date(dto.dateFin) : null,
        qualityScore: dto.qualityScore === undefined ? undefined : dto.qualityScore,
      },
      include: { apprenant: true, contrat: true, superviseur: true },
    });
  }

  // Apprenants diplômés (tier vivier) sans mission active — vivier
  // effectivement déployable côté production, réutilisé par le formulaire
  // "Assigner une mission" pour ne proposer que des candidats pertinents.
  async listApprenantsDisponibles() {
    const apprenants = await this.prisma.apprenant.findMany({
      include: {
        groupe: true,
        evaluationAttempt: true,
        missions: { where: { dateFin: null } },
      },
    });
    return apprenants
      .filter((a) => a.missions.length === 0)
      .map((a) => ({
        id: a.id,
        matricule: a.matricule,
        prenom: a.prenom,
        nom: a.nom,
        groupeLabel: a.groupe.label,
      }));
  }

  // ---- Comparatifs --------------------------------------------------------

  async getPerformanceSuperviseurs() {
    const superviseurs = await this.prisma.superviseur.findMany({
      include: { missions: { where: { dateFin: null } } },
      orderBy: { nom: "asc" },
    });
    return superviseurs.map((s) => {
      const scores = s.missions
        .map((m) => m.qualityScore)
        .filter((v): v is number => v !== null);
      const qualityScoreMoyen =
        scores.length > 0 ? round2(scores.reduce((sum, v) => sum + v, 0) / scores.length) : null;
      return {
        matricule: s.matricule,
        prenom: s.prenom,
        nom: s.nom,
        agentsActifs: s.missions.length,
        qualityScoreMoyen,
      };
    });
  }

  async getVueEnsembleProduction() {
    const [agentsActifs, missionsTotal, contratsActifs, superviseursCount] = await Promise.all([
      this.prisma.mission.count({ where: { dateFin: null } }),
      this.prisma.mission.count(),
      this.prisma.contratB2B.count({ where: { statut: "actif" } }),
      this.prisma.superviseur.count(),
    ]);
    return { agentsActifs, missionsTotal, contratsActifs, superviseursCount };
  }

  // ---- Facturation & tableau de bord financier -------------------------------

  listFactures() {
    return this.prisma.facture.findMany({
      include: { contrat: true },
      orderBy: { dateEmission: "desc" },
    });
  }

  createFacture(dto: CreateFactureDto) {
    return this.prisma.facture.create({
      data: { contratId: dto.contratId, periode: dto.periode, montant: dto.montant },
      include: { contrat: true },
    });
  }

  async marquerFacturePayee(id: string) {
    const existing = await this.prisma.facture.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Facture introuvable.");
    return this.prisma.facture.update({
      where: { id },
      data: { statut: "payee", datePaiement: new Date() },
      include: { contrat: true },
    });
  }

  async getTableauFinancier() {
    const [contratsActifs, factures] = await Promise.all([
      this.prisma.contratB2B.findMany({ where: { statut: "actif" } }),
      this.prisma.facture.findMany({ include: { contrat: true } }),
    ]);

    const revenuMensuelPotentiel = round2(
      contratsActifs.reduce((sum, c) => sum + (c.tarifMensuel ?? 0), 0)
    );
    const totalFacture = round2(factures.reduce((sum, f) => sum + f.montant, 0));
    const totalPaye = round2(
      factures.filter((f) => f.statut === "payee").reduce((sum, f) => sum + f.montant, 0)
    );
    const totalEnAttente = round2(totalFacture - totalPaye);

    const parContrat = contratsActifs.map((c) => {
      const facturesContrat = factures.filter((f) => f.contratId === c.id);
      return {
        clientNom: c.clientNom,
        tarifMensuel: c.tarifMensuel,
        totalFacture: round2(facturesContrat.reduce((sum, f) => sum + f.montant, 0)),
        totalPaye: round2(
          facturesContrat.filter((f) => f.statut === "payee").reduce((sum, f) => sum + f.montant, 0)
        ),
      };
    });

    return { revenuMensuelPotentiel, totalFacture, totalPaye, totalEnAttente, parContrat };
  }
}
