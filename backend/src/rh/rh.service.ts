import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CockpitService } from '../cockpit/cockpit.service';
import { NotationService } from '../notation/notation.service';
import { UpsertReunionDto } from './dto/upsert-reunion.dto';
import { UpsertFormateurDto } from './dto/upsert-formateur.dto';

// Certification "vivier" — mêmes seuils/tiers que le pipeline d'admission
// (voir evaluation/scoring.ts) : un candidat admis en niveau_c1 ou en
// placement_direct est considéré prêt à être déployé, contrairement à un
// apprenant encore en formation. Pas de notion de "diplômé de l'Académie"
// distincte à ce stade (nécessiterait un vrai statut de fin de cursus).
const TIERS_VIVIER = ['niveau_c1', 'placement_direct'];

// Statuts d'EvaluationAttempt considérés comme "recrutement en cours" — tout
// ce qui n'est pas encore allé au bout du pipeline (candidat non retenu
// exclu : "rejete" n'est plus "en cours").
const STATUTS_RECRUTEMENT_EN_COURS = [
  'en_cours',
  'soumis',
  'en_correction',
  'corrige',
  'valide_pret_envoi',
  'contrat_envoye',
  'en_attente_paiement',
];

@Injectable()
export class RhService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cockpit: CockpitService,
    private readonly notation: NotationService,
  ) {}

  // ---- Vue d'ensemble -----------------------------------------------------

  async getVueEnsemble() {
    const [
      apprenants,
      groupesAvecApprenants,
      recrutementsEnCours,
      connecteurs,
    ] = await Promise.all([
      this.prisma.apprenant.findMany({ include: { evaluationAttempt: true } }),
      this.prisma.apprenant.findMany({
        select: { groupeId: true },
        distinct: ['groupeId'],
      }),
      this.prisma.evaluationAttempt.count({
        where: { status: { in: STATUTS_RECRUTEMENT_EN_COURS } },
      }),
      this.prisma.connecteur.findMany({ select: { status: true } }),
    ]);

    const talentsEnVivier = apprenants.filter(
      (a) =>
        a.evaluationAttempt &&
        TIERS_VIVIER.includes(a.evaluationAttempt.tier ?? ''),
    ).length;

    const partenairesActifs = connecteurs.filter(
      (c) => c.status === 'actif',
    ).length;

    return {
      talentsEnVivier,
      agentsEnProductionActive: 0, // nécessite le futur module de staffing client — voir note frontend
      vaguesEnFormation: groupesAvecApprenants.length,
      recrutementsEnCours,
      apprenantsTotal: apprenants.length,
      partenairesActifs,
      partenairesTotal: connecteurs.length,
    };
  }

  // ---- Registre global des agents & apprenants -----------------------------

  async getRegistre() {
    const apprenants = await this.prisma.apprenant.findMany({
      include: { groupe: true, evaluationAttempt: true },
      orderBy: { matricule: 'asc' },
    });

    return apprenants.map((a) => {
      const tier = a.evaluationAttempt?.tier ?? null;
      return {
        matricule: a.matricule,
        prenom: a.prenom,
        nom: a.nom,
        email: a.email,
        statut:
          tier && TIERS_VIVIER.includes(tier) ? 'Certifié' : 'En Formation',
        formation: a.groupe.label,
        dateAdmission: a.evaluationAttempt?.gradedAt ?? null,
        derniereMissionClient: null as string | null, // pas de module de staffing pour l'instant
      };
    });
  }

  // ---- Partenaires (Connecteurs / apporteurs d'affaires) -------------------

  async getPartenaires() {
    const connecteurs = await this.prisma.connecteur.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return connecteurs.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      activityType: c.activityType,
      clientCount: c.clientCount,
      status: c.status,
      createdAt: c.createdAt,
    }));
  }

  async updatePartenaireStatut(id: string, status: string) {
    const connecteur = await this.prisma.connecteur.findUnique({
      where: { id },
    });
    if (!connecteur) throw new NotFoundException('Partenaire introuvable.');
    return this.prisma.connecteur.update({ where: { id }, data: { status } });
  }

  // ---- Réunions -------------------------------------------------------------

  listReunions() {
    return this.prisma.reunion.findMany({ orderBy: { startAt: 'desc' } });
  }

  createReunion(dto: UpsertReunionDto) {
    return this.prisma.reunion.create({
      data: {
        titre: dto.titre,
        description: dto.description,
        audience: dto.audience,
        participants: JSON.stringify(dto.participants ?? []),
        startAt: new Date(dto.startAt),
        dureeMinutes: dto.dureeMinutes ?? 60,
        lieu: dto.lieu,
      },
    });
  }

  async updateReunion(id: string, dto: UpsertReunionDto) {
    const existing = await this.prisma.reunion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Réunion introuvable.');
    return this.prisma.reunion.update({
      where: { id },
      data: {
        titre: dto.titre,
        description: dto.description,
        audience: dto.audience,
        participants: JSON.stringify(dto.participants ?? []),
        startAt: new Date(dto.startAt),
        dureeMinutes: dto.dureeMinutes ?? existing.dureeMinutes,
        lieu: dto.lieu,
      },
    });
  }

  async cancelReunion(id: string) {
    const existing = await this.prisma.reunion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Réunion introuvable.');
    return this.prisma.reunion.update({
      where: { id },
      data: { statut: 'annulee' },
    });
  }

  // ---- Formateurs & assignation aux groupes --------------------------------
  // Ajouté suite à la demande du 2026-08-26 : jusqu'ici il n'existait aucun
  // lien Formateur↔Groupe en base (un seul compte formateur de test partagé
  // pour toute la plateforme) — voir Groupe.formateurId. Reste volontairement
  // un CRUD "annuaire" (matricule/nom/email), pas un vrai système de comptes
  // individuels : le login formateur reste le stopgap partagé
  // (FORMATEUR_TEST_MATRICULE), inchangé ici — le client avait explicitement
  // demandé MOINS de friction sur cet accès récemment (voir TrainerGuard
  // retiré le 2026-08-25), pas plus de comptes à gérer.

  listFormateurs() {
    return this.prisma.formateur.findMany({
      include: { groupes: true },
      orderBy: { nom: 'asc' },
    });
  }

  async createFormateur(dto: UpsertFormateurDto) {
    const existing = await this.prisma.formateur.findUnique({
      where: { matricule: dto.matricule },
    });
    if (existing) {
      throw new BadRequestException(
        `Un formateur avec le matricule "${dto.matricule}" existe déjà.`,
      );
    }
    return this.prisma.formateur.create({ data: dto });
  }

  async updateFormateur(id: string, dto: UpsertFormateurDto) {
    const existing = await this.prisma.formateur.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Formateur introuvable.');
    if (dto.matricule !== existing.matricule) {
      const conflict = await this.prisma.formateur.findUnique({
        where: { matricule: dto.matricule },
      });
      if (conflict) {
        throw new BadRequestException(
          `Un formateur avec le matricule "${dto.matricule}" existe déjà.`,
        );
      }
    }
    return this.prisma.formateur.update({ where: { id }, data: dto });
  }

  async assignFormateur(groupeId: string, formateurId: string | null) {
    const groupe = await this.prisma.groupe.findUnique({
      where: { id: groupeId },
    });
    if (!groupe) throw new NotFoundException('Groupe introuvable.');
    if (formateurId) {
      const formateur = await this.prisma.formateur.findUnique({
        where: { id: formateurId },
      });
      if (!formateur) throw new NotFoundException('Formateur introuvable.');
    }
    return this.prisma.groupe.update({
      where: { id: groupeId },
      data: { formateurId },
      include: { formateur: true },
    });
  }

  async updateGroupeTypeCours(groupeId: string, typeCours: string | null) {
    const groupe = await this.prisma.groupe.findUnique({
      where: { id: groupeId },
    });
    if (!groupe) throw new NotFoundException('Groupe introuvable.');
    return this.prisma.groupe.update({
      where: { id: groupeId },
      data: { typeCours },
    });
  }

  async updateVagueDates(
    groupeId: string,
    dateDebut: Date | null,
    dateFin: Date | null,
  ) {
    const groupe = await this.prisma.groupe.findUnique({
      where: { id: groupeId },
    });
    if (!groupe) throw new NotFoundException('Groupe introuvable.');
    return this.prisma.groupe.update({
      where: { id: groupeId },
      data: { dateDebut, dateFin },
    });
  }

  // Vue "Vagues" enrichie — chaque groupe avec ses dates, son type de
  // cours, son formateur et son vrai taux de réussite (voir
  // CockpitService.getTauxReussiteParGroupe). Remplace la simple liste de
  // chips A-F par une vraie table de pilotage.
  async getVagues() {
    const [groupes, tauxReussiteParGroupe] = await Promise.all([
      this.prisma.groupe.findMany({
        include: { formateur: true, _count: { select: { apprenants: true } } },
        orderBy: { cle: 'asc' },
      }),
      this.cockpit.getTauxReussiteParGroupe(),
    ]);

    return groupes.map((g) => ({
      id: g.id,
      cle: g.cle,
      label: g.label,
      typeCours: g.typeCours,
      dateDebut: g.dateDebut,
      dateFin: g.dateFin,
      formateurNom: g.formateur ? `${g.formateur.prenom} ${g.formateur.nom}` : null,
      apprenantsCount: g._count.apprenants,
      tauxReussite: tauxReussiteParGroupe.get(g.cle) ?? 0,
    }));
  }

  // Comparatif réel — moyenne des groupes que chaque formateur encadre
  // (réutilise le calcul de moyenne du Cockpit Formateur, voir
  // CockpitService.getGroupes). Un formateur sans groupe assigné, ou dont
  // les groupes n'ont encore aucune moyenne calculable, apparaît avec
  // moyenne=null plutôt que d'être omis silencieusement.
  async getPerformanceFormateurs() {
    const [formateurs, groupesAvecMoyenne] = await Promise.all([
      this.prisma.formateur.findMany({
        include: { groupes: true },
        orderBy: { nom: 'asc' },
      }),
      this.cockpit.getGroupes(),
    ]);

    const moyenneParCle = new Map(
      groupesAvecMoyenne.map((g) => [g.cle, g.moyenne]),
    );

    return formateurs.map((f) => {
      const moyennes = f.groupes
        .map((g) => moyenneParCle.get(g.cle))
        .filter((m): m is number => m !== null && m !== undefined);
      const moyenne =
        moyennes.length > 0
          ? Math.round(
              (moyennes.reduce((s, v) => s + v, 0) / moyennes.length) * 100,
            ) / 100
          : null;
      return {
        matricule: f.matricule,
        prenom: f.prenom,
        nom: f.nom,
        groupes: f.groupes.map((g) => g.label),
        moyenne,
      };
    });
  }

  // ---- Cycle complet — vue unifiée recrutement -> formation -> production -
  // Une ligne par candidat, du dépôt de sa candidature jusqu'à son statut
  // actuel — assemble ce qui existe déjà (EvaluationAttempt, Apprenant,
  // Groupe, Formateur) plutôt que d'inventer un nouveau modèle. La colonne
  // "production" reste explicitement vide (pas de module de staffing
  // client — voir agentsEnProductionActive dans getVueEnsemble) : la ligne
  // existe pour montrer où ce candidat s'arrête dans le cycle aujourd'hui,
  // pas pour prétendre savoir où il travaille.
  async getCycleComplet() {
    const attempts = await this.prisma.evaluationAttempt.findMany({
      include: {
        candidat: true,
        apprenant: { include: { groupe: { include: { formateur: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return attempts.map((a) => ({
      attemptId: a.id,
      candidat: {
        firstName: a.candidat.firstName,
        lastName: a.candidat.lastName,
        email: a.candidat.email,
        phone: a.candidat.phone,
      },
      coordonneesRecuesLe: a.candidat.createdAt,
      testStatut: a.status,
      testSoumisLe: a.submittedAt,
      totalScore: a.totalScore,
      tier: a.tier,
      contratEnvoyeLe: a.contractSentAt,
      paiementConfirmeLe: a.paymentConfirmedAt,
      paiementReference: a.paymentReference,
      apprenant: a.apprenant
        ? {
            matricule: a.apprenant.matricule,
            groupeLabel: a.apprenant.groupe.label,
            typeCours: a.apprenant.groupe.typeCours,
            formateurNom: a.apprenant.groupe.formateur
              ? `${a.apprenant.groupe.formateur.prenom} ${a.apprenant.groupe.formateur.nom}`
              : null,
          }
        : null,
      // Bientôt disponible — voir note ci-dessus.
      production: null as null,
    }));
  }

  // ---- Casiers avec historique ---------------------------------------------
  // Fiches détaillées par entité — réutilisent des données déjà tracées
  // (notations, présences) plutôt que d'introduire un journal d'audit
  // séparé. Pour Formateur/Partenaire, il n'existe aujourd'hui aucun
  // historique des changements (réaffectation de groupe, changement de
  // statut) — seul l'état actuel est tracé en base, donc ces deux casiers
  // montrent l'état actuel + ce qui EST réellement historisé (vagues
  // encadrées, candidature), pas un faux journal d'événements.

  async getApprenantCasier(matricule: string) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { matricule },
      include: {
        groupe: { include: { formateur: true } },
        evaluationAttempt: { include: { candidat: true } },
      },
    });
    if (!apprenant) throw new NotFoundException('Apprenant introuvable.');

    const [notationsParSeance, presences] = await Promise.all([
      this.notation.listApprenantNotations(matricule),
      this.prisma.presence.findMany({
        where: { apprenantId: apprenant.id },
        include: { seance: true },
        orderBy: { joinedAt: 'asc' },
      }),
    ]);

    return {
      matricule: apprenant.matricule,
      prenom: apprenant.prenom,
      nom: apprenant.nom,
      email: apprenant.email,
      groupeLabel: apprenant.groupe.label,
      typeCours: apprenant.groupe.typeCours,
      formateurNom: apprenant.groupe.formateur
        ? `${apprenant.groupe.formateur.prenom} ${apprenant.groupe.formateur.nom}`
        : null,
      abonnementExpireAt: apprenant.abonnementExpireAt,
      admission: apprenant.evaluationAttempt
        ? {
            totalScore: apprenant.evaluationAttempt.totalScore,
            tier: apprenant.evaluationAttempt.tier,
            gradedAt: apprenant.evaluationAttempt.gradedAt,
          }
        : null,
      historiqueNotations: notationsParSeance,
      historiquePresences: presences.map((p) => ({
        seanceNumero: p.seance.numero,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        dureeSecondes: p.dureeSecondes,
      })),
    };
  }

  async getFormateurCasier(id: string) {
    const formateur = await this.prisma.formateur.findUnique({
      where: { id },
      include: { groupes: { include: { _count: { select: { apprenants: true } } } } },
    });
    if (!formateur) throw new NotFoundException('Formateur introuvable.');

    const tauxParGroupe = await this.cockpit.getTauxReussiteParGroupe();

    return {
      matricule: formateur.matricule,
      prenom: formateur.prenom,
      nom: formateur.nom,
      email: formateur.email,
      vagues: formateur.groupes.map((g) => ({
        label: g.label,
        typeCours: g.typeCours,
        dateDebut: g.dateDebut,
        dateFin: g.dateFin,
        apprenantsCount: g._count.apprenants,
        tauxReussite: tauxParGroupe.get(g.cle) ?? 0,
      })),
    };
  }

  async getPartenaireCasier(id: string) {
    const connecteur = await this.prisma.connecteur.findUnique({ where: { id } });
    if (!connecteur) throw new NotFoundException('Partenaire introuvable.');

    return {
      firstName: connecteur.firstName,
      lastName: connecteur.lastName,
      email: connecteur.email,
      phone: connecteur.phone,
      activityType: connecteur.activityType,
      clientCount: connecteur.clientCount,
      soughtRoles: JSON.parse(connecteur.soughtRoles) as string[],
      cvVolume: connecteur.cvVolume,
      budgetPerAgent: connecteur.budgetPerAgent,
      presentationMode: connecteur.presentationMode,
      paymentChannel: connecteur.paymentChannel,
      opportunityTiming: connecteur.opportunityTiming,
      status: connecteur.status,
      candidatureRecueLe: connecteur.createdAt,
    };
  }
}
