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
      agentsEnProductionActive,
      apprenantsFol,
    ] = await Promise.all([
      this.prisma.apprenant.findMany({ include: { evaluationAttempt: true } }),
      this.prisma.apprenant.findMany({
        select: { groupeId: true },
        distinct: ['groupeId'],
      }),
      this.prisma.evaluationAttempt.count({
        where: { status: { in: STATUTS_RECRUTEMENT_EN_COURS } },
      }),
      this.prisma.connecteur.findMany({ select: { status: true, createdAt: true } }),
      this.prisma.mission.count({ where: { dateFin: null } }),
      this.prisma.apprenant.findMany({
        where: {
          groupe: { typeCours: 'FOL' },
          abonnementExpireAt: { gt: new Date() },
        },
        select: { id: true },
      }),
    ]);

    const talentsEnVivier = apprenants.filter(
      (a) =>
        a.evaluationAttempt &&
        TIERS_VIVIER.includes(a.evaluationAttempt.tier ?? ''),
    ).length;

    const partenairesActifs = connecteurs.filter(
      (c) => c.status === 'actif',
    ).length;

    // Croissance des apporteurs d'affaires sur le mois en cours — réel,
    // calculé depuis les dates de création des Connecteurs (pas de snapshot
    // historique nécessaire). Null si aucun apporteur n'existait avant ce
    // mois (pourcentage non significatif).
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const apporteursAvantCeMois = connecteurs.filter(
      (c) => c.createdAt < debutMois,
    ).length;
    const apporteursNouveauxMTD = connecteurs.filter(
      (c) => c.createdAt >= debutMois,
    ).length;
    const apporteursGrowthPctMTD =
      apporteursAvantCeMois > 0
        ? Math.round((apporteursNouveauxMTD / apporteursAvantCeMois) * 1000) / 10
        : null;

    return {
      talentsEnVivier,
      agentsEnProductionActive,
      vaguesEnFormation: groupesAvecApprenants.length,
      recrutementsEnCours,
      apprenantsTotal: apprenants.length,
      partenairesActifs,
      partenairesTotal: connecteurs.length,
      apporteursNouveauxMTD,
      apporteursGrowthPctMTD,
      abonnementsFolActifs: apprenantsFol.length,
    };
  }

  // ---- Registre global des agents & apprenants -----------------------------

  async getRegistre() {
    const apprenants = await this.prisma.apprenant.findMany({
      include: {
        groupe: true,
        evaluationAttempt: true,
        missions: {
          include: { contrat: true },
          orderBy: { dateDebut: 'desc' },
          take: 1,
        },
      },
      orderBy: { matricule: 'asc' },
    });

    return apprenants.map((a) => {
      const tier = a.evaluationAttempt?.tier ?? null;
      const derniereMission = a.missions[0];
      const enProduction = derniereMission && derniereMission.dateFin === null;
      return {
        matricule: a.matricule,
        prenom: a.prenom,
        nom: a.nom,
        email: a.email,
        statut: enProduction
          ? 'En Production'
          : tier && TIERS_VIVIER.includes(tier)
            ? 'Certifié'
            : 'En Formation',
        formation: a.groupe.label,
        dateAdmission: a.evaluationAttempt?.gradedAt ?? null,
        derniereMissionClient: derniereMission?.contrat.clientNom ?? null,
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
  // actuel — assemble EvaluationAttempt, Apprenant, Groupe, Formateur et
  // (depuis le module Production, 2026-08-26) sa mission active le cas
  // échéant. "production" reste null pour un apprenant sans mission active
  // (encore en formation, ou en pause entre deux missions) — jamais un
  // statut inventé.
  async getCycleComplet() {
    const attempts = await this.prisma.evaluationAttempt.findMany({
      include: {
        candidat: true,
        apprenant: {
          include: {
            groupe: { include: { formateur: true } },
            missions: {
              where: { dateFin: null },
              include: { contrat: true, superviseur: true },
              take: 1,
            },
          },
        },
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
      production: a.apprenant?.missions[0]
        ? {
            clientNom: a.apprenant.missions[0].contrat.clientNom,
            role: a.apprenant.missions[0].role,
            depuisLe: a.apprenant.missions[0].dateDebut,
            superviseurNom: a.apprenant.missions[0].superviseur
              ? `${a.apprenant.missions[0].superviseur.prenom} ${a.apprenant.missions[0].superviseur.nom}`
              : null,
          }
        : null,
    }));
  }

  // Fiche détail d'une personne, depuis le Cycle complet — union de tout ce
  // qui existe sur elle (test bloc par bloc, contrat, paiement, et si elle
  // est devenue apprenant : formation + historique + production) en une
  // seule page, plutôt que de forcer la RH à recouper 3 casiers séparés.
  // Contrairement à getApprenantCasier (clé = matricule, apprenant déjà
  // créé), celle-ci part de l'EvaluationAttempt : elle marche aussi pour un
  // candidat encore en tout début de pipeline, sans compte Apprenant.
  async getPersonneCasier(attemptId: string) {
    const attempt = await this.prisma.evaluationAttempt.findUnique({
      where: { id: attemptId },
      include: {
        candidat: true,
        apprenant: {
          include: {
            groupe: { include: { formateur: true } },
            missions: {
              include: { contrat: true, superviseur: true },
              orderBy: { dateDebut: 'desc' },
            },
          },
        },
      },
    });
    if (!attempt) throw new NotFoundException('Tentative introuvable.');

    let formation: {
      matricule: string;
      groupeLabel: string;
      typeCours: string | null;
      formateurNom: string | null;
      abonnementExpireAt: Date | null;
      historiqueNotations: Awaited<ReturnType<NotationService['listApprenantNotations']>>;
      historiquePresences: {
        seanceNumero: number;
        joinedAt: Date;
        leftAt: Date | null;
        dureeSecondes: number | null;
      }[];
    } | null = null;
    let production: {
      clientNom: string;
      role: string;
      dateDebut: Date;
      dateFin: Date | null;
      superviseurNom: string | null;
      qualityScore: number | null;
    }[] = [];

    if (attempt.apprenant) {
      const [notationsParSeance, presences] = await Promise.all([
        this.notation.listApprenantNotations(attempt.apprenant.matricule),
        this.prisma.presence.findMany({
          where: { apprenantId: attempt.apprenant.id },
          include: { seance: true },
          orderBy: { joinedAt: 'asc' },
        }),
      ]);

      formation = {
        matricule: attempt.apprenant.matricule,
        groupeLabel: attempt.apprenant.groupe.label,
        typeCours: attempt.apprenant.groupe.typeCours,
        formateurNom: attempt.apprenant.groupe.formateur
          ? `${attempt.apprenant.groupe.formateur.prenom} ${attempt.apprenant.groupe.formateur.nom}`
          : null,
        abonnementExpireAt: attempt.apprenant.abonnementExpireAt,
        historiqueNotations: notationsParSeance,
        historiquePresences: presences.map((p) => ({
          seanceNumero: p.seance.numero,
          joinedAt: p.joinedAt,
          leftAt: p.leftAt,
          dureeSecondes: p.dureeSecondes,
        })),
      };

      production = attempt.apprenant.missions.map((m) => ({
        clientNom: m.contrat.clientNom,
        role: m.role,
        dateDebut: m.dateDebut,
        dateFin: m.dateFin,
        superviseurNom: m.superviseur ? `${m.superviseur.prenom} ${m.superviseur.nom}` : null,
        qualityScore: m.qualityScore,
      }));
    }

    return {
      attemptId: attempt.id,
      candidat: {
        firstName: attempt.candidat.firstName,
        lastName: attempt.candidat.lastName,
        email: attempt.candidat.email,
        phone: attempt.candidat.phone,
        coordonneesRecuesLe: attempt.candidat.createdAt,
      },
      test: {
        statut: attempt.status,
        submittedAt: attempt.submittedAt,
        gradedAt: attempt.gradedAt,
        lexiqueScore: attempt.lexiqueScore,
        oralScore: attempt.oralScore,
        situationsScore: attempt.situationsScore,
        videoScore: attempt.videoScore,
        essayScore: attempt.essayScore,
        totalScore: attempt.totalScore,
        tier: attempt.tier,
      },
      contrat: {
        duree: attempt.contractDuree,
        frais: attempt.contractFrais,
        conditions: attempt.contractConditions,
        envoyeLe: attempt.contractSentAt,
      },
      paiement: {
        reference: attempt.paymentReference,
        confirmeLe: attempt.paymentConfirmedAt,
      },
      formation,
      production,
    };
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
        missions: {
          include: { contrat: true, superviseur: true },
          orderBy: { dateDebut: 'desc' },
        },
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
      historiqueMissions: apprenant.missions.map((m) => ({
        clientNom: m.contrat.clientNom,
        role: m.role,
        dateDebut: m.dateDebut,
        dateFin: m.dateFin,
        superviseurNom: m.superviseur ? `${m.superviseur.prenom} ${m.superviseur.nom}` : null,
        qualityScore: m.qualityScore,
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

  // ---- Administratif & alerte (Vue d'ensemble) ------------------------------

  // Alertes réelles et actionnables pour la Vue d'ensemble — jamais un
  // texte statique : chaque item disparaît de lui-même une fois la
  // situation résolue (test validé, groupe affecté), pas de mécanisme de
  // "dismiss" séparé qui masquerait un vrai signal en attente.
  async getAlertesAdministratives() {
    const [testsCorriges, groupesSansFormateur, formateurs, reunionsAVenir] =
      await Promise.all([
        this.prisma.evaluationAttempt.findMany({
          where: { status: 'corrige' },
          include: { candidat: true },
          orderBy: { gradedAt: 'asc' },
        }),
        this.prisma.groupe.findMany({
          where: { formateurId: null },
          include: { _count: { select: { apprenants: true } } },
        }),
        this.prisma.formateur.findMany({ orderBy: { nom: 'asc' } }),
        this.prisma.reunion.findMany({
          where: { statut: 'planifiee', startAt: { gte: new Date() } },
          orderBy: { startAt: 'asc' },
          take: 3,
        }),
      ]);

    return {
      testsEnAttenteValidation: testsCorriges.map((t) => ({
        attemptId: t.id,
        candidatNom: `${t.candidat.firstName} ${t.candidat.lastName}`,
        totalScore: t.totalScore,
        gradedAt: t.gradedAt,
      })),
      groupesSansFormateur: groupesSansFormateur
        .filter((g) => g._count.apprenants > 0)
        .map((g) => ({
          groupeId: g.id,
          label: g.label,
          typeCours: g.typeCours,
          nbApprenants: g._count.apprenants,
        })),
      formateursDisponibles: formateurs.map((f) => ({
        id: f.id,
        nom: `${f.prenom} ${f.nom}`,
      })),
      reunionsAVenir: reunionsAVenir.map((r) => ({
        id: r.id,
        titre: r.titre,
        startAt: r.startAt,
      })),
    };
  }
}
