import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CockpitService } from '../cockpit/cockpit.service';
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
}
