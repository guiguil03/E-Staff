import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Règle de base (Ravaka, 2026-08-27) : E-Staf doit toucher 20% net garanti
// du CA, quoi qu'il en coûte — ce n'est pas un reliquat qui flotte selon les
// charges réelles, c'est un plancher. Les 6 postes de charge ci-dessous
// doivent donc impérativement tenir dans les 80% restants.
const MARGIN_PCT_ESTAF = 0.2;
const CHARGES_PCT_TOTAL = 1 - MARGIN_PCT_ESTAF;

// Poids relatifs entre les 6 postes de charge — repris tels quels de la
// structure fournie par le client (50/7.5/7.5/5/10/10, soit 90 au total),
// puis rescalés proportionnellement pour tenir dans les 80% de CA
// disponibles une fois la marge E-Staf prélevée. Voir DecaissementProduction.
const RATIOS_POSTES: { key: string; label: string; ratio: number }[] = [
  { key: "salaires_agents", label: "Salaires Fixes Agents", ratio: 50 },
  { key: "charges_infrastructure", label: "Charges Fixes Infrastructure", ratio: 7.5 },
  { key: "pool_superviseurs", label: "Pool Superviseurs", ratio: 7.5 },
  { key: "commissions_apporteurs", label: "Commissions Apporteurs d'Affaires", ratio: 5 },
  { key: "primes_performance", label: "Primes Performance Agents", ratio: 10 },
  { key: "commission_demarrage", label: "Commission Démarrage Client (Mois 1)", ratio: 10 },
];
const RATIO_TOTAL = RATIOS_POSTES.reduce((sum, p) => sum + p.ratio, 0);

const POSTES_BUDGET: { key: string; label: string; pct: number }[] = RATIOS_POSTES.map((p) => ({
  key: p.key,
  label: p.label,
  pct: (p.ratio / RATIO_TOTAL) * CHARGES_PCT_TOTAL,
}));

function currentPeriode(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Étiquette de semaine ISO ("AAAA-Wss"), utilisée pour regrouper les
// objectifs journaliers en comparatif hebdomadaire et pour identifier les
// suivis agents / rapports superviseur d'une semaine donnée.
function isoWeekLabel(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
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
        dateSignature: dto.dateSignature ? new Date(dto.dateSignature) : null,
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
        dateSignature:
          dto.dateSignature === undefined
            ? undefined
            : dto.dateSignature
              ? new Date(dto.dateSignature)
              : null,
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
      dateSignature: contrat.dateSignature,
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
        tarifNegocie: dto.tarifNegocie ?? null,
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
        tarifNegocie: dto.tarifNegocie === undefined ? undefined : dto.tarifNegocie,
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

  // ---- Cartes Mission/Client (vue Production) --------------------------------

  // Une carte par contrat actif — nom du client, intitulé de la mission,
  // superviseur principal (celui de la mission active la plus récente) et
  // jauge d'objectif (dernier ObjectifJournalier saisi, ou null si aucune
  // saisie n'existe encore — jamais une valeur inventée).
  async getCartesMissionClient() {
    const contrats = await this.prisma.contratB2B.findMany({
      where: { statut: "actif" },
      include: {
        missions: {
          where: { dateFin: null },
          include: { superviseur: true },
          orderBy: { dateDebut: "desc" },
        },
        objectifsJournaliers: { orderBy: { jour: "desc" }, take: 1 },
      },
      orderBy: { clientNom: "asc" },
    });

    return contrats.map((c) => {
      const superviseurPrincipal = c.missions.find((m) => m.superviseur)?.superviseur ?? null;
      return {
        contratId: c.id,
        clientNom: c.clientNom,
        intitule: c.description,
        superviseurNom: superviseurPrincipal
          ? `${superviseurPrincipal.prenom} ${superviseurPrincipal.nom}`
          : null,
        objectifPct: c.objectifsJournaliers[0]?.tauxAtteint ?? null,
        agentsActifs: c.missions.length,
      };
    });
  }

  async getContratModalData(contratId: string) {
    const contrat = await this.prisma.contratB2B.findUnique({
      where: { id: contratId },
      include: {
        missions: {
          where: { dateFin: null },
          include: { apprenant: true, superviseur: true },
          orderBy: { dateDebut: "desc" },
        },
        objectifsJournaliers: { orderBy: { jour: "asc" } },
        rapportsHebdo: { include: { superviseur: true }, orderBy: { semaine: "desc" } },
        entrepriseProjet: true,
      },
    });
    if (!contrat) throw new NotFoundException("Contrat introuvable.");

    // Onglet 1 — objectif journalier (30 derniers jours saisis) + comparatif
    // hebdomadaire (moyenne des jours saisis par semaine ISO, 8 dernières
    // semaines ayant au moins une saisie).
    const objectifsJournaliers = contrat.objectifsJournaliers.slice(-30).map((o) => ({
      jour: o.jour,
      tauxAtteint: o.tauxAtteint,
    }));

    const parSemaine = new Map<string, { total: number; count: number }>();
    for (const o of contrat.objectifsJournaliers) {
      const semaine = isoWeekLabel(new Date(o.jour));
      const entry = parSemaine.get(semaine) ?? { total: 0, count: 0 };
      entry.total += o.tauxAtteint;
      entry.count += 1;
      parSemaine.set(semaine, entry);
    }
    const comparatifHebdo = Array.from(parSemaine.entries())
      .map(([semaine, { total, count }]) => ({ semaine, moyenneTaux: round2(total / count) }))
      .sort((a, b) => (a.semaine < b.semaine ? -1 : 1))
      .slice(-8);

    // Onglet 2 — dernière semaine renseignée par mission active sur ce
    // contrat. Un agent sans saisie apparaît quand même dans le tableau,
    // avec des valeurs "—" côté frontend plutôt qu'être omis.
    const missionIds = contrat.missions.map((m) => m.id);
    const suivis = missionIds.length
      ? await this.prisma.suiviAgentHebdo.findMany({
          where: { missionId: { in: missionIds } },
          orderBy: { semaine: "desc" },
        })
      : [];
    const dernierSuiviParMission = new Map<string, (typeof suivis)[number]>();
    for (const s of suivis) {
      if (!dernierSuiviParMission.has(s.missionId)) dernierSuiviParMission.set(s.missionId, s);
    }
    const performanceAgents = contrat.missions.map((m) => {
      const suivi = dernierSuiviParMission.get(m.id) ?? null;
      return {
        missionId: m.id,
        agentNom: `${m.apprenant.prenom} ${m.apprenant.nom}`,
        agentMatricule: m.apprenant.matricule,
        agentEmail: m.apprenant.email,
        superviseurNom: m.superviseur ? `${m.superviseur.prenom} ${m.superviseur.nom}` : null,
        superviseurEmail: m.superviseur?.email ?? null,
        semaine: suivi?.semaine ?? null,
        concretisations: suivi?.concretisations ?? null,
        tauxAbsence: suivi?.tauxAbsence ?? null,
        nbRetards: suivi?.nbRetards ?? null,
        remarques: suivi?.remarques ?? null,
      };
    });

    // Onglet 3 — rapports hebdomadaires du superviseur, plus récents d'abord.
    const rapportsHebdo = contrat.rapportsHebdo.map((r) => ({
      id: r.id,
      semaine: r.semaine,
      constat: r.constat,
      analyse: r.analyse,
      axesAmelioration: r.axesAmelioration,
      superviseurNom: r.superviseur ? `${r.superviseur.prenom} ${r.superviseur.nom}` : null,
      updatedAt: r.updatedAt,
    }));

    return {
      contratId: contrat.id,
      clientNom: contrat.clientNom,
      description: contrat.description,
      dateSignature: contrat.dateSignature,
      dateDebut: contrat.dateDebut,
      dateFin: contrat.dateFin,
      statut: contrat.statut,
      // Coordonnées du contact client — nulles si le contrat n'a pas été créé
      // depuis un lead "Proposer un projet" (entrepriseProjetId absent).
      clientEmail: contrat.entrepriseProjet?.email ?? null,
      objectifsJournaliers,
      comparatifHebdo,
      performanceAgents,
      rapportsHebdo,
    };
  }

  async upsertObjectifJournalier(contratId: string, dto: UpsertObjectifJournalierDto) {
    const contrat = await this.prisma.contratB2B.findUnique({ where: { id: contratId } });
    if (!contrat) throw new NotFoundException("Contrat introuvable.");
    const jour = new Date(dto.jour);
    jour.setUTCHours(0, 0, 0, 0);
    return this.prisma.objectifJournalier.upsert({
      where: { contratId_jour: { contratId, jour } },
      create: { contratId, jour, tauxAtteint: dto.tauxAtteint },
      update: { tauxAtteint: dto.tauxAtteint },
    });
  }

  async upsertSuiviAgentHebdo(missionId: string, dto: UpsertSuiviAgentHebdoDto) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException("Mission introuvable.");
    return this.prisma.suiviAgentHebdo.upsert({
      where: { missionId_semaine: { missionId, semaine: dto.semaine } },
      create: {
        missionId,
        semaine: dto.semaine,
        concretisations: dto.concretisations ?? 0,
        tauxAbsence: dto.tauxAbsence ?? null,
        nbRetards: dto.nbRetards ?? 0,
        remarques: dto.remarques ?? null,
      },
      update: {
        concretisations: dto.concretisations ?? 0,
        tauxAbsence: dto.tauxAbsence ?? null,
        nbRetards: dto.nbRetards ?? 0,
        remarques: dto.remarques ?? null,
      },
    });
  }

  // ---- Tableau de bord financier global (budget vs. décaissements) -----------

  // Vue globale : CA total des contrats actifs ventilé en 6 postes de
  // charge (80% du CA — le solde des 20% de marge E-Staf garantie), comparé
  // au réel saisi par la RH. Matérialise (get-or-create) une ligne
  // DecaissementProduction par poste et par période au premier accès, avec
  // le montant théorique calculé et le montant réel initialisé à la même
  // valeur — la RH corrige ensuite si le réel diffère.
  async getTableauFinancierGlobal(periode?: string) {
    const p = periode ?? currentPeriode();

    const contratsActifs = await this.prisma.contratB2B.findMany({ where: { statut: "actif" } });
    const caTotal = round2(contratsActifs.reduce((sum, c) => sum + (c.tarifMensuel ?? 0), 0));

    const postes = await Promise.all(
      POSTES_BUDGET.map(async ({ key, label, pct }) => {
        const montantTheorique = round2(caTotal * pct);
        const existing = await this.prisma.decaissementProduction.findUnique({
          where: { poste_periode: { poste: key, periode: p } },
        });
        const row =
          existing ??
          (await this.prisma.decaissementProduction.create({
            data: { poste: key, periode: p, montantTheorique, montantReel: montantTheorique },
          }));
        return {
          poste: key,
          label,
          pctAlloc: pct,
          montantTheorique: row.montantTheorique,
          montantReel: row.montantReel,
          ecart: round2(row.montantTheorique - row.montantReel),
          statut: row.statut,
          datePaiement: row.datePaiement,
        };
      })
    );

    const budgetTheoriqueGlobal = round2(postes.reduce((sum, p2) => sum + p2.montantTheorique, 0));
    const depenseReelleValidee = round2(postes.reduce((sum, p2) => sum + p2.montantReel, 0));
    // Marge E-Staf = 20% du CA, garantie — jamais un simple reliquat des
    // dépenses réelles (voir MARGIN_PCT_ESTAF).
    const marginNetteTheorique = round2(caTotal * MARGIN_PCT_ESTAF);
    const payees = postes.filter((p2) => p2.statut === "paye").length;

    return {
      periode: p,
      caTotal,
      budgetTheoriqueGlobal,
      depenseReelleValidee,
      economieNette: round2(budgetTheoriqueGlobal - depenseReelleValidee),
      marginNetteTheorique,
      statutOperations: { payees, enAttente: postes.length - payees, total: postes.length },
      postes,
    };
  }

  async updateDecaissementMontantReel(
    poste: string,
    periode: string,
    dto: UpdateDecaissementDto
  ) {
    const existing = await this.prisma.decaissementProduction.findUnique({
      where: { poste_periode: { poste, periode } },
    });
    if (!existing) throw new NotFoundException("Ligne budgétaire introuvable.");
    return this.prisma.decaissementProduction.update({
      where: { poste_periode: { poste, periode } },
      data: { montantReel: dto.montantReel },
    });
  }

  async payerDecaissement(poste: string, periode: string) {
    const existing = await this.prisma.decaissementProduction.findUnique({
      where: { poste_periode: { poste, periode } },
    });
    if (!existing) throw new NotFoundException("Ligne budgétaire introuvable.");
    return this.prisma.decaissementProduction.update({
      where: { poste_periode: { poste, periode } },
      data: { statut: "paye", datePaiement: new Date() },
    });
  }

  async payerTousDecaissements(periode: string) {
    await this.prisma.decaissementProduction.updateMany({
      where: { periode, statut: { not: "paye" } },
      data: { statut: "paye", datePaiement: new Date() },
    });
    return this.getTableauFinancierGlobal(periode);
  }

  // Détail par client — même ventilation 80/20 appliquée au tarifMensuel de
  // chaque contrat actif, purement informatif (non persisté, contrairement
  // au tableau global ci-dessus qui suit les paiements réels poste par
  // poste).
  async getDetailFinancierParClient() {
    const contrats = await this.prisma.contratB2B.findMany({
      where: { statut: "actif" },
      orderBy: { clientNom: "asc" },
    });
    return contrats.map((c) => {
      const ca = c.tarifMensuel ?? 0;
      const postes = POSTES_BUDGET.map(({ key, label, pct }) => ({
        poste: key,
        label,
        montant: round2(ca * pct),
      }));
      const totalCharges = round2(postes.reduce((sum, p2) => sum + p2.montant, 0));
      return {
        clientNom: c.clientNom,
        ca,
        postes,
        totalCharges,
        margeNetteTheorique: round2(ca * MARGIN_PCT_ESTAF),
      };
    });
  }

  // ---- Détail micro : paie des agents (traçabilité "Salaires Fixes Agents" +
  // "Primes Performance Agents") -----------------------------------------------

  // Vision agent par agent, contrat par contrat : qui a été payé combien,
  // pourquoi (la prime suggérée part du qualityScore de la mission — la
  // seule mesure de performance par agent existante, faute d'objectif
  // chiffré individuel — scaled par le poids "Primes Performance Agents" du
  // tableau global), et par quel moyen. Matérialise (get-or-create) une
  // ligne PaiementAgent par mission active et par période au premier accès,
  // comme pour DecaissementProduction — la RH corrige ensuite le réel.
  async getDetailPaieAgents(periode?: string) {
    const p = periode ?? currentPeriode();
    const primePct = POSTES_BUDGET.find((x) => x.key === "primes_performance")?.pct ?? 0;

    const missions = await this.prisma.mission.findMany({
      where: { dateFin: null },
      include: { apprenant: true, contrat: true, superviseur: true },
      orderBy: { dateDebut: "desc" },
    });

    const lignes = await Promise.all(
      missions.map(async (m) => {
        const existing = await this.prisma.paiementAgent.findUnique({
          where: { missionId_periode: { missionId: m.id, periode: p } },
        });
        const tarif = m.tarifNegocie ?? 0;
        const primeSuggeree =
          m.qualityScore !== null ? round2(tarif * primePct * (m.qualityScore / 5)) : 0;
        const row =
          existing ??
          (await this.prisma.paiementAgent.create({
            data: {
              missionId: m.id,
              periode: p,
              montantBase: tarif,
              montantPrime: primeSuggeree,
            },
          }));
        return {
          missionId: m.id,
          agentNom: `${m.apprenant.prenom} ${m.apprenant.nom}`,
          agentMatricule: m.apprenant.matricule,
          clientNom: m.contrat.clientNom,
          superviseurNom: m.superviseur ? `${m.superviseur.prenom} ${m.superviseur.nom}` : null,
          tarifNegocie: m.tarifNegocie,
          qualityScore: m.qualityScore,
          tauxAtteinteObjectifs: m.qualityScore !== null ? round2((m.qualityScore / 5) * 100) : null,
          montantBase: row.montantBase,
          montantPrime: row.montantPrime,
          moyenPaiement: row.moyenPaiement,
          statut: row.statut,
          datePaiement: row.datePaiement,
        };
      })
    );

    return { periode: p, lignes };
  }

  async updatePaiementAgent(missionId: string, periode: string, dto: UpdatePaiementAgentDto) {
    const existing = await this.prisma.paiementAgent.findUnique({
      where: { missionId_periode: { missionId, periode } },
    });
    if (!existing) throw new NotFoundException("Ligne de paie introuvable.");
    return this.prisma.paiementAgent.update({
      where: { missionId_periode: { missionId, periode } },
      data: {
        montantBase: dto.montantBase ?? undefined,
        montantPrime: dto.montantPrime ?? undefined,
        moyenPaiement: dto.moyenPaiement === undefined ? undefined : dto.moyenPaiement,
      },
    });
  }

  async payerAgent(missionId: string, periode: string) {
    const existing = await this.prisma.paiementAgent.findUnique({
      where: { missionId_periode: { missionId, periode } },
    });
    if (!existing) throw new NotFoundException("Ligne de paie introuvable.");
    return this.prisma.paiementAgent.update({
      where: { missionId_periode: { missionId, periode } },
      data: { statut: "paye", datePaiement: new Date() },
    });
  }

  // ---- Détail micro : pool des superviseurs (traçabilité "Pool Superviseurs") -

  // Lecture seule — pour quels clients travaille chaque superviseur et leur
  // taux d'atteinte des objectifs (qualityScore moyen des agents qu'ils
  // supervisent, seule mesure de performance disponible). Pas de paiement
  // individuel ici : le poste "Pool Superviseurs" reste une ligne globale
  // dans DecaissementProduction, ceci n'est que la ventilation qui la
  // justifie.
  async getDetailPoolSuperviseurs() {
    const superviseurs = await this.prisma.superviseur.findMany({
      include: { missions: { where: { dateFin: null }, include: { contrat: true } } },
      orderBy: { nom: "asc" },
    });
    return superviseurs.map((s) => {
      const scores = s.missions.map((m) => m.qualityScore).filter((v): v is number => v !== null);
      const qualityScoreMoyen =
        scores.length > 0 ? round2(scores.reduce((sum, v) => sum + v, 0) / scores.length) : null;
      const clients = Array.from(new Set(s.missions.map((m) => m.contrat.clientNom)));
      return {
        matricule: s.matricule,
        prenom: s.prenom,
        nom: s.nom,
        clients,
        agentsActifs: s.missions.length,
        qualityScoreMoyen,
        tauxAtteinteObjectifs: qualityScoreMoyen !== null ? round2((qualityScoreMoyen / 5) * 100) : null,
      };
    });
  }

  async upsertRapportHebdo(contratId: string, dto: UpsertRapportHebdoDto) {
    const contrat = await this.prisma.contratB2B.findUnique({ where: { id: contratId } });
    if (!contrat) throw new NotFoundException("Contrat introuvable.");
    return this.prisma.rapportHebdoSuperviseur.upsert({
      where: { contratId_semaine: { contratId, semaine: dto.semaine } },
      create: {
        contratId,
        semaine: dto.semaine,
        superviseurId: dto.superviseurId ?? null,
        constat: dto.constat ?? null,
        analyse: dto.analyse ?? null,
        axesAmelioration: dto.axesAmelioration ?? null,
      },
      update: {
        superviseurId: dto.superviseurId ?? null,
        constat: dto.constat ?? null,
        analyse: dto.analyse ?? null,
        axesAmelioration: dto.axesAmelioration ?? null,
      },
    });
  }

  // ---- État financier global : Production (Vue d'ensemble macro) -------------

  // Par client actif : CA réellement encaissé (factures payées, pas le
  // tarif théorique) ventilé en coût estimé (80%) / bénéfice net E-Staf
  // (20%) — voir MARGIN_PCT_ESTAF. Pas de "dépenses réelles" par client ici
  // (le suivi réel des décaissements n'existe qu'au niveau global, voir
  // DecaissementProduction) — seulement ce qui est honnêtement calculable
  // par contrat.
  async getEtatFinancierProductionParClient() {
    const contrats = await this.prisma.contratB2B.findMany({
      where: { statut: "actif" },
      include: {
        missions: { where: { dateFin: null } },
        factures: { where: { statut: "payee" } },
      },
      orderBy: { clientNom: "asc" },
    });

    return contrats.map((c) => {
      const caEncaisse = round2(c.factures.reduce((sum, f) => sum + f.montant, 0));
      return {
        clientNom: c.clientNom,
        nbAgents: c.missions.length,
        caEncaisse,
        coutEstime: round2(caEncaisse * CHARGES_PCT_TOTAL),
        beneficeNetEstaf: round2(caEncaisse * MARGIN_PCT_ESTAF),
      };
    });
  }

  // Tendance mensuelle réelle — CA encaissé (factures payées) vs. dépenses
  // réelles validées (DecaissementProduction), regroupés par mois où une
  // donnée existe réellement. Aucun mois fabriqué : un mois sans facture ni
  // décaissement n'apparaît simplement pas dans la série.
  async getTendanceMensuelleProduction() {
    const [factures, decaissements] = await Promise.all([
      this.prisma.facture.findMany({ where: { statut: "payee" } }),
      this.prisma.decaissementProduction.findMany(),
    ]);

    const parMois = new Map<string, { caEncaisse: number; depenseReelle: number }>();
    for (const f of factures) {
      const mois = f.periode;
      const entry = parMois.get(mois) ?? { caEncaisse: 0, depenseReelle: 0 };
      entry.caEncaisse += f.montant;
      parMois.set(mois, entry);
    }
    for (const d of decaissements) {
      const entry = parMois.get(d.periode) ?? { caEncaisse: 0, depenseReelle: 0 };
      entry.depenseReelle += d.montantReel;
      parMois.set(d.periode, entry);
    }

    return Array.from(parMois.entries())
      .map(([periode, v]) => ({
        periode,
        caEncaisse: round2(v.caEncaisse),
        depenseReelle: round2(v.depenseReelle),
      }))
      .sort((a, b) => (a.periode < b.periode ? -1 : 1));
  }
}
