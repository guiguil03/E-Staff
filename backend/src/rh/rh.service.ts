import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CockpitService } from '../cockpit/cockpit.service';
import { NotationService } from '../notation/notation.service';
import { EmailService } from '../common/email.service';
import { StorageService } from '../common/storage.service';
import { renderEmailHtml, emailParagraph, emailParagraphsFromText, credentialsBox } from '../common/email-template';
import { TIER_LABELS } from '../evaluation/evaluation.service';
import { EnvoyerResultatsDto } from './dto/envoyer-resultats.dto';
import { UpsertReunionDto } from './dto/upsert-reunion.dto';
import { UpsertFormateurDto } from './dto/upsert-formateur.dto';
import { UpdateApprenantRhDto } from './dto/update-apprenant-rh.dto';
import { CreateEncaissementDto } from './dto/create-encaissement.dto';
import { UpdateEncaissementDto } from './dto/update-encaissement.dto';
import { UpdatePaiementFormateurDto } from './dto/update-paiement-formateur.dto';
import { CreateApprenantDto } from './dto/create-apprenant.dto';
import { CreateAgentAcquisitionDto } from './dto/create-agent-acquisition.dto';
import { RenouvelerAbonnementDto } from './dto/renouveler-abonnement.dto';

// Certification "vivier" — mêmes seuils/tiers que le pipeline d'admission
// (voir evaluation/scoring.ts) : un candidat admis en niveau_c1 ou en
// placement_direct est considéré prêt à être déployé, contrairement à un
// apprenant encore en formation. Pas de notion de "diplômé de l'Académie"
// distincte à ce stade (nécessiterait un vrai statut de fin de cursus).
const TIERS_VIVIER = ['niveau_c1', 'placement_direct'];

// État financier Académie — inverse de MARGIN_PCT_ESTAF côté Production
// (charges 80% / marge 20%) : la Formation a une structure de coûts bien
// plus légère (pas de masse salariale d'agents), donc coût prévu 20% / marge
// nette e-Staf 80% du CA théorique (règle métier donnée par le client).
const COUT_PCT_FORMATION = 0.2;
const MARGIN_PCT_FORMATION = 0.8;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function currentPeriode(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Étiquette de semaine ISO ("AAAA-Wss") — même formule que côté Production
// (ProductionService.isoWeekLabel), dupliquée ici plutôt que partagée entre
// modules (convention du projet, voir currentPeriode/round2 déjà dupliqués).
function isoWeekLabel(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function moisLabel(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Alphabet sans caractères ambigus (pas de 0/O, 1/l/I) — même génération que
// EvaluationService.generateTemporaryPassword, dupliquée ici plutôt que
// partagée entre modules (convention du projet, voir currentPeriode/round2).
const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function generateTemporaryPassword(length = 10): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => TEMP_PASSWORD_CHARS[b % TEMP_PASSWORD_CHARS.length]).join('');
}

// Commission fixe des Agents d'Acquisition (distincts des Connecteurs/
// apporteurs B2B, commission récurrente de 5% — voir ProductionService) : 5€
// par apprenant converti (paiement confirmé) et 5€ par réinscription
// (renouvellement d'abonnement FOL), montant demandé par la cliente le
// 2026-09-15. En euros, pas en Ariary comme le reste de la Formation —
// commission versée telle quelle, jamais convertie.
const COMMISSION_CONVERSION_EUR = 5;
const COMMISSION_REINSCRIPTION_EUR = 5;

// Regroupement fixe demandé pour le tableau "Paie & Commissions" côté
// Académie — un formateur est rattaché au bucket de son premier groupe
// (trié par clé) dont le type de cours matche ; "Formation externe" sert de
// repli pour tout type non reconnu ou absent (jamais un bucket inventé).
const BUCKETS_PAIE_FORMATEURS = [
  'TEF Canada',
  'DELF DALF',
  'DFP',
  'FOL',
  'Formation externe',
] as const;

function bucketTypeCours(typeCours: string | null): (typeof BUCKETS_PAIE_FORMATEURS)[number] {
  if (!typeCours) return 'Formation externe';
  const t = typeCours.toUpperCase();
  if (t.includes('TEF') || t.includes('TCF')) return 'TEF Canada';
  if (t.includes('DELF') || t.includes('DALF')) return 'DELF DALF';
  if (t.includes('DFP')) return 'DFP';
  if (t.includes('FOL')) return 'FOL';
  return 'Formation externe';
}

function bucketFormateur(
  groupes: { cle: string; typeCours: string | null }[],
): (typeof BUCKETS_PAIE_FORMATEURS)[number] {
  const premier = [...groupes].sort((a, b) => (a.cle < b.cle ? -1 : 1))[0];
  return bucketTypeCours(premier?.typeCours ?? null);
}

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
    private readonly email: EmailService,
    private readonly storage: StorageService,
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

  // Registre global — un formateur assigné, une date de test (soumission),
  // un niveau et une entrée en prod (première mission, distincte de la
  // dernière utilisée pour le statut/client courant) en plus des champs
  // déjà là, demandés par la cliente le 2026-09-20 pour donner une vraie
  // traçabilité de bout en bout (test -> inscription -> formation -> prod).
  async getRegistre() {
    const apprenants = await this.prisma.apprenant.findMany({
      include: {
        groupe: { include: { formateur: true } },
        evaluationAttempt: true,
        missions: {
          include: { contrat: true },
          orderBy: { dateDebut: 'asc' },
        },
      },
      orderBy: { matricule: 'asc' },
    });

    return apprenants.map((a) => {
      const tier = a.evaluationAttempt?.tier ?? null;
      const premiereMission = a.missions[0] ?? null;
      const derniereMission = a.missions[a.missions.length - 1] ?? null;
      const enProduction = !!derniereMission && derniereMission.dateFin === null;
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
        niveau: tier ? TIER_LABELS[tier] ?? tier : null,
        dateTest: a.evaluationAttempt?.submittedAt ?? null,
        dateAdmission: a.evaluationAttempt?.gradedAt ?? null,
        dateInscription: a.createdAt,
        finInscription: a.abonnementExpireAt,
        formateurAssigne: a.groupe.formateur
          ? `${a.groupe.formateur.prenom} ${a.groupe.formateur.nom}`
          : null,
        dateEntreeProd: premiereMission?.dateDebut ?? null,
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

    const { groupeIds, ...formateurData } = dto;
    const temporaryPassword = generateTemporaryPassword();
    const formateur = await this.prisma.formateur.create({
      data: { ...formateurData, password: await bcrypt.hash(temporaryPassword, 10) },
    });

    // Assignation en une seule fois (voir UpsertFormateurDto.groupeIds) —
    // réutilise le même champ Groupe.formateurId que le menu déroulant
    // "Assigner un groupe" existant, donc réassigne silencieusement un
    // groupe déjà pris par un autre formateur, même comportement que ce
    // menu déroulant.
    if (groupeIds && groupeIds.length > 0) {
      await this.prisma.groupe.updateMany({
        where: { id: { in: groupeIds } },
        data: { formateurId: formateur.id },
      });
    }

    await this.email.send({
      to: dto.email,
      subject: 'Bienvenue chez e-Staf — vos identifiants formateur',
      text: `Bonjour ${dto.prenom},\n\nUn compte formateur a été créé pour vous sur e-Staf.\n\nVos identifiants pour vous connecter à votre Cockpit Formateur :\nMatricule : ${dto.matricule}\nMot de passe temporaire : ${temporaryPassword}\n\nÀ très vite,\nL'équipe e-Staf`,
      html: renderEmailHtml({
        title: 'Bienvenue chez e-Staf',
        preheader: 'Vos identifiants pour votre Cockpit Formateur',
        bodyHtml:
          emailParagraph(`Bonjour ${dto.prenom},`) +
          emailParagraph('Un compte formateur a été créé pour vous sur e-Staf.') +
          credentialsBox([
            { label: 'Matricule', value: dto.matricule },
            { label: 'Mot de passe temporaire', value: temporaryPassword },
          ]) +
          emailParagraph('Connectez-vous à votre Cockpit Formateur avec ces identifiants.'),
      }),
    });

    return this.prisma.formateur.findUnique({
      where: { id: formateur.id },
      include: { groupes: true },
    });
  }

  // Réémet un mot de passe temporaire — utile si le formateur l'a perdu
  // (pas d'auto-service "mot de passe oublié" côté formateur pour l'instant,
  // voir brainstorm 2026-09-16).
  async regenerateFormateurCredentials(id: string) {
    const formateur = await this.prisma.formateur.findUnique({ where: { id } });
    if (!formateur) throw new NotFoundException('Formateur introuvable.');

    const temporaryPassword = generateTemporaryPassword();
    await this.prisma.formateur.update({
      where: { id },
      data: { password: await bcrypt.hash(temporaryPassword, 10) },
    });

    await this.email.send({
      to: formateur.email,
      subject: 'Vos nouveaux identifiants e-Staf',
      text: `Bonjour ${formateur.prenom},\n\nVoici vos nouveaux identifiants pour vous connecter à votre Cockpit Formateur :\nMatricule : ${formateur.matricule}\nMot de passe temporaire : ${temporaryPassword}\n\nL'équipe e-Staf`,
      html: renderEmailHtml({
        title: 'Vos nouveaux identifiants',
        preheader: 'Mot de passe régénéré pour votre Cockpit Formateur',
        bodyHtml:
          emailParagraph(`Bonjour ${formateur.prenom},`) +
          emailParagraph('Voici vos nouveaux identifiants pour vous connecter à votre Cockpit Formateur :') +
          credentialsBox([
            { label: 'Matricule', value: formateur.matricule },
            { label: 'Mot de passe temporaire', value: temporaryPassword },
          ]),
      }),
    });

    return { ok: true };
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

  // Un formateur n'encadre qu'un seul type de cours à la fois (règle métier
  // du 2026-09-20 : les critères d'évaluation diffèrent entre DELF/DALF,
  // TEF, FOL...) — vérifié ici plutôt qu'en base (pas de contrainte SQL
  // simple pour "au plus une valeur distincte parmi les groupes liés"). Ne
  // bloque rien tant que le groupe cible n'a pas encore de typeCours
  // renseigné : la règle ne s'applique qu'aux types réellement engagés.
  private async assertFormateurTypeCoursCompatible(
    formateurId: string,
    groupeId: string,
    typeCours: string | null,
  ) {
    if (!typeCours) return;
    const autresGroupes = await this.prisma.groupe.findMany({
      where: { formateurId, id: { not: groupeId }, typeCours: { not: null } },
    });
    const conflit = autresGroupes.find((g) => g.typeCours !== typeCours);
    if (conflit) {
      throw new BadRequestException(
        `Ce formateur encadre déjà un groupe de type "${conflit.typeCours}" — un formateur ne peut être assigné qu'à un seul type de cours.`,
      );
    }
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
      await this.assertFormateurTypeCoursCompatible(formateurId, groupeId, groupe.typeCours);
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
    if (groupe.formateurId) {
      await this.assertFormateurTypeCoursCompatible(groupe.formateurId, groupeId, typeCours);
    }
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
        dataPurgedAt: attempt.candidat.dataPurgedAt,
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
      resultats: {
        envoyesLe: attempt.resultatsEnvoyesLe,
        canal: attempt.resultatsCanal,
        modele: attempt.resultatsModele,
      },
      paiement: {
        reference: attempt.paymentReference,
        confirmeLe: attempt.paymentConfirmedAt,
      },
      formation,
      production,
    };
  }

  // Purge RGPD manuelle (Cycle complet — bouton "Supprimer les données
  // personnelles") : supprime du stockage S3 le CV, les enregistrements
  // audio/vidéo des mises en situation et le PDF de contrat, puis anonymise
  // les coordonnées du candidat en base. Volontairement limité aux données
  // directement identifiantes et aux fichiers ; les réponses texte (essai,
  // partie ouverte) portent sur des sujets imposés et gardent leur valeur
  // d'audit de notation, elles ne sont pas touchées. Irréversible — pas de
  // "undo" possible une fois les fichiers supprimés du bucket.
  async purgeCandidatData(attemptId: string) {
    const attempt = await this.prisma.evaluationAttempt.findUnique({
      where: { id: attemptId },
      include: { candidat: true, situationResponses: true, videoResponses: true },
    });
    if (!attempt) throw new NotFoundException('Tentative introuvable.');
    if (attempt.candidat.dataPurgedAt) {
      throw new BadRequestException('Les données de ce candidat ont déjà été supprimées.');
    }

    const keysToDelete = [
      attempt.candidat.cvKey,
      attempt.contractPdfKey,
      ...attempt.situationResponses.map((s) => s.audioUrl),
      ...attempt.videoResponses.map((v) => v.videoUrl),
    ].filter((key): key is string => Boolean(key));

    // Pas de rattrapage silencieux : si un fichier ne peut pas être
    // supprimé (droit d'accès, clé déjà absente...), la purge s'arrête et
    // remonte l'erreur plutôt que de marquer le candidat "purgé" alors que
    // des données personnelles subsistent réellement dans le bucket.
    await Promise.all(keysToDelete.map((key) => this.storage.deleteObject(key)));

    const dataPurgedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.candidat.update({
        where: { id: attempt.candidat.id },
        data: {
          firstName: 'Anonymisé',
          lastName: '',
          email: `anonymise-${attempt.candidat.id}@e-staf.local`,
          phone: '',
          cvKey: null,
          dataPurgedAt,
        },
      }),
      this.prisma.evaluationAttempt.update({
        where: { id: attempt.id },
        data: { contractPdfKey: attempt.contractPdfKey ? null : undefined },
      }),
      ...attempt.situationResponses.map((s) =>
        this.prisma.situationResponse.update({ where: { id: s.id }, data: { audioUrl: 'SUPPRIME_RGPD' } })
      ),
      ...attempt.videoResponses.map((v) =>
        this.prisma.videoResponse.update({ where: { id: v.id }, data: { videoUrl: 'SUPPRIME_RGPD' } })
      ),
    ]);

    return { ok: true, dataPurgedAt };
  }

  // ---- Envoi des résultats au candidat (Cycle complet) ---------------------
  // Distinct de l'envoi du contrat (EvaluationService.sendContractNow) — la
  // RH peut vouloir prévenir le candidat de son résultat par mail ou
  // WhatsApp avant même que le contrat soit prêt, avec un message adapté au
  // type de parcours (voir MODELES_ENVOI_RESULTATS). Pas d'API WhatsApp
  // payante branchée : le canal "whatsapp" ne fait rien envoyer côté
  // serveur, il compose juste le message et renvoie un lien wa.me que la RH
  // ouvre elle-même pour envoyer depuis son propre compte.
  private composerMessageResultats(
    modele: EnvoyerResultatsDto['modele'],
    attempt: {
      candidat: { firstName: string };
      totalScore: number | null;
      tier: string | null;
    },
  ): string {
    const tierLabel = attempt.tier
      ? TIER_LABELS[attempt.tier] ?? attempt.tier
      : 'en cours d\'évaluation';
    const scoreLine = `Résultat de votre évaluation e-Staf : ${attempt.totalScore ?? '—'}/100 — ${tierLabel}.`;

    const suites: Record<EnvoyerResultatsDto['modele'], string> = {
      delf_dalf:
        "Prochaine étape : votre préparation DELF/DALF va démarrer, l'équipe pédagogique vous recontactera pour l'affectation de groupe et le calendrier des séances.",
      tef: "Prochaine étape : votre préparation TEF Canada/TCF va démarrer, l'équipe pédagogique vous recontactera pour l'affectation de groupe et le calendrier des séances.",
      dfp: "Prochaine étape : votre préparation DFP va démarrer, l'équipe pédagogique vous recontactera pour l'affectation de groupe et le calendrier des séances.",
      postulant_prod:
        'Prochaine étape : vous êtes orienté(e) directement vers un placement en production, notre équipe vous recontactera pour les modalités de contrat.',
    };

    return `Bonjour ${attempt.candidat.firstName},\n\n${scoreLine}\n\n${suites[modele]}\n\nL'équipe e-Staf`;
  }

  // Heuristique Madagascar : un numéro local commence par 0 (ex.
  // "034 12 345 67") — wa.me exige l'indicatif pays sans le 0. Un numéro
  // déjà au format international (commence par autre chose que 0) est
  // laissé tel quel.
  private toWhatsAppNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('0') ? `261${digits.slice(1)}` : digits;
  }

  async envoyerResultatsCandidat(attemptId: string, dto: EnvoyerResultatsDto) {
    const attempt = await this.prisma.evaluationAttempt.findUnique({
      where: { id: attemptId },
      include: { candidat: true },
    });
    if (!attempt) throw new NotFoundException('Tentative introuvable.');

    const message = this.composerMessageResultats(dto.modele, attempt);
    let waLink: string | undefined;

    if (dto.canal === 'mail') {
      await this.email.send({
        to: attempt.candidat.email,
        subject: 'Vos résultats e-Staf',
        text: message,
        html: renderEmailHtml({
          title: 'Vos résultats',
          preheader: 'Le résultat de votre évaluation e-Staf',
          bodyHtml: emailParagraphsFromText(message),
        }),
      });
    } else {
      const number = this.toWhatsAppNumber(attempt.candidat.phone);
      waLink = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    }

    await this.prisma.evaluationAttempt.update({
      where: { id: attemptId },
      data: {
        resultatsEnvoyesLe: new Date(),
        resultatsCanal: dto.canal,
        resultatsModele: dto.modele,
      },
    });

    return { message, waLink };
  }

  // ---- Coordonnées consolidées (candidats + CV + vidéos de test) -----------
  // Une ligne par tentative d'évaluation (même granularité que
  // getCycleComplet) — regroupe ce qui est aujourd'hui éparpillé entre
  // plusieurs casiers : coordonnées, lien CV (si déposé, voir Candidat.cvKey)
  // et liens vers les vidéos du Bloc 5, streamées via les endpoints déjà
  // utilisés par le formateur (GET /evaluation/video-responses/:id/video).
  async getCoordonnees() {
    const attempts = await this.prisma.evaluationAttempt.findMany({
      include: {
        candidat: true,
        videoResponses: { orderBy: { taskIndex: 'asc' } },
        apprenant: { include: { groupe: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return attempts.map((a) => ({
      attemptId: a.id,
      candidatId: a.candidatId,
      nomComplet: `${a.candidat.firstName} ${a.candidat.lastName}`,
      email: a.candidat.email,
      phone: a.candidat.phone,
      cvDisponible: Boolean(a.candidat.cvKey),
      videoResponseIds: a.videoResponses.map((v) => v.id),
      matricule: a.apprenant?.matricule ?? null,
      typeCours: a.apprenant?.groupe.typeCours ?? null,
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
        connecteur: true,
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
      groupeId: apprenant.groupeId,
      groupeLabel: apprenant.groupe.label,
      typeCours: apprenant.groupe.typeCours,
      formateurNom: apprenant.groupe.formateur
        ? `${apprenant.groupe.formateur.prenom} ${apprenant.groupe.formateur.nom}`
        : null,
      abonnementExpireAt: apprenant.abonnementExpireAt,
      tracabilite: {
        connecteurId: apprenant.connecteurId,
        connecteurNom: apprenant.connecteur
          ? `${apprenant.connecteur.firstName} ${apprenant.connecteur.lastName}`
          : null,
        sourceRecrutement: apprenant.sourceRecrutement,
        statutAgent: apprenant.statutAgent,
      },
      coordonneesPaiement: {
        ribOuMobileMoney: apprenant.ribOuMobileMoney,
        moyenPaiementType: apprenant.moyenPaiementType,
        verifieLe: apprenant.coordonneesVerifieesLe,
      },
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

  // Traçabilité recrutement (apporteur, source) + coordonnées de paiement
  // vérifiées — saisies une fois par la RH à l'onboarding, réutilisées
  // automatiquement partout ailleurs (commissions apporteurs, paie agents)
  // plutôt que ressaisies. Voir ProductionService.getDetailPaieAgents /
  // getCommissionsApporteurs.
  async updateApprenantRh(matricule: string, dto: UpdateApprenantRhDto) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant) throw new NotFoundException('Apprenant introuvable.');
    if (dto.connecteurId) {
      const connecteur = await this.prisma.connecteur.findUnique({
        where: { id: dto.connecteurId },
      });
      if (!connecteur) throw new NotFoundException('Apporteur introuvable.');
    }
    // Réaffectation de groupe — corrige une confirmation de paiement faite
    // sur le mauvais groupe (voir EvaluationService.confirmPayment, qui fixe
    // le groupe définitivement à la création du compte sans retour en
    // arrière possible depuis cet écran-là).
    if (dto.groupeId) {
      const groupe = await this.prisma.groupe.findUnique({ where: { id: dto.groupeId } });
      if (!groupe) throw new NotFoundException('Groupe introuvable.');
    }
    return this.prisma.apprenant.update({
      where: { matricule },
      data: {
        connecteurId: dto.connecteurId === undefined ? undefined : dto.connecteurId,
        sourceRecrutement:
          dto.sourceRecrutement === undefined ? undefined : dto.sourceRecrutement,
        groupeId: dto.groupeId ?? undefined,
        statutAgent: dto.statutAgent ?? undefined,
        ribOuMobileMoney:
          dto.ribOuMobileMoney === undefined ? undefined : dto.ribOuMobileMoney,
        moyenPaiementType:
          dto.moyenPaiementType === undefined ? undefined : dto.moyenPaiementType,
        // Toute modification des coordonnées de paiement doit repasser par
        // une nouvelle vérification RH — jamais silencieusement conservée.
        coordonneesVerifieesLe:
          dto.ribOuMobileMoney !== undefined || dto.moyenPaiementType !== undefined
            ? new Date()
            : undefined,
      },
    });
  }

  // Numérotation des matricules — même format/algorithme que
  // EvaluationService.generateNextMatricule (dupliqué ici, convention du
  // projet), et lit la même table Apprenant : pas de risque de collision
  // entre un compte créé via le pipeline de recrutement et un compte créé
  // ici directement par la RH.
  private async generateNextMatricule(): Promise<string> {
    const existing = await this.prisma.apprenant.findMany({
      where: { matricule: { startsWith: 'ETF-2026-' } },
      select: { matricule: true },
    });
    const maxN = existing.reduce((max, a) => {
      const m = /^ETF-2026-(\d+)$/.exec(a.matricule);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    return `ETF-2026-${String(maxN + 1).padStart(4, '0')}`;
  }

  // Création directe d'un compte apprenant par la RH — hors pipeline de
  // recrutement (pas de test/EvaluationAttempt), pour les cas d'inscription
  // manuelle. Même mécanique que EvaluationService.confirmPayment : matricule
  // auto-généré, mot de passe temporaire haché et envoyé une seule fois en
  // clair par e-mail.
  async createApprenantAccount(dto: CreateApprenantDto) {
    const groupe = await this.prisma.groupe.findUnique({ where: { id: dto.groupeId } });
    if (!groupe) throw new NotFoundException('Groupe introuvable.');

    const matricule = await this.generateNextMatricule();
    const temporaryPassword = generateTemporaryPassword();
    const apprenant = await this.prisma.apprenant.create({
      data: {
        matricule,
        prenom: dto.prenom,
        nom: dto.nom,
        email: dto.email,
        groupeId: groupe.id,
        password: await bcrypt.hash(temporaryPassword, 10),
      },
    });

    await this.email.send({
      to: dto.email,
      subject: 'Bienvenue chez e-Staf — vos identifiants',
      text: `Bonjour ${dto.prenom},\n\nUn compte apprenant a été créé pour vous dans le ${groupe.label}.\n\nVos identifiants pour vous connecter à votre tableau de bord personnel :\nMatricule : ${matricule}\nMot de passe temporaire : ${temporaryPassword}\n\nNous vous conseillons de changer ce mot de passe dès votre première connexion (Paramètres > Changer mon mot de passe).\n\nÀ très vite,\nL'équipe e-Staf`,
      html: renderEmailHtml({
        title: 'Bienvenue chez e-Staf',
        preheader: `Vos identifiants pour le ${groupe.label}`,
        bodyHtml:
          emailParagraph(`Bonjour ${dto.prenom},`) +
          emailParagraph(`Un compte apprenant a été créé pour vous dans le <strong>${groupe.label}</strong>.`) +
          credentialsBox([
            { label: 'Matricule', value: matricule },
            { label: 'Mot de passe temporaire', value: temporaryPassword },
          ]) +
          emailParagraph('Nous vous conseillons de changer ce mot de passe dès votre première connexion (Paramètres&nbsp;&gt; Changer mon mot de passe).'),
      }),
    });

    return apprenant;
  }

  async getFormateurCasier(id: string) {
    const formateur = await this.prisma.formateur.findUnique({
      where: { id },
      include: { groupes: { include: { _count: { select: { apprenants: true } } } } },
    });
    if (!formateur) throw new NotFoundException('Formateur introuvable.');

    const [tauxParGroupe, vivierCount, documents, bilans] = await Promise.all([
      this.cockpit.getTauxReussiteParGroupe(),
      this.cockpit.getVivierCountForFormateur(id),
      this.prisma.formateurDocument.findMany({
        where: { formateurId: id },
        orderBy: { createdAt: 'desc' },
      }),
      this.cockpit.listBilansFormateur(id),
    ]);

    return {
      matricule: formateur.matricule,
      prenom: formateur.prenom,
      nom: formateur.nom,
      email: formateur.email,
      vivierCount,
      vagues: formateur.groupes.map((g) => ({
        label: g.label,
        typeCours: g.typeCours,
        dateDebut: g.dateDebut,
        dateFin: g.dateFin,
        apprenantsCount: g._count.apprenants,
        tauxReussite: tauxParGroupe.get(g.cle) ?? 0,
      })),
      // Le contrat est un FormateurDocument comme les fiches de prép (voir
      // schema.prisma), distingué par type — le plus récent fait foi en cas
      // de renouvellement, pas d'historique de versions pour l'instant.
      contrat: documents.find((d) => d.type === 'contrat') ?? null,
      fichesPreparation: documents.filter((d) => d.type === 'fiche_preparation'),
      bilans,
    };
  }

  // Contrat déposé par la RH sur la fiche du formateur (voir
  // FormateurDocument dans schema.prisma) — même stockage S3-compatible que
  // les fiches de prép, distingué par type/uploadedBy.
  async uploadFormateurContrat(id: string, file: Express.Multer.File) {
    const formateur = await this.prisma.formateur.findUnique({ where: { id } });
    if (!formateur) throw new NotFoundException('Formateur introuvable.');

    const extension = path.extname(file.originalname) || '';
    const key = `formateurs/${formateur.id}/contrat/${Date.now()}${extension}`;
    await this.storage.uploadBuffer(key, file.buffer, file.mimetype || 'application/octet-stream');
    return this.prisma.formateurDocument.create({
      data: {
        formateurId: formateur.id,
        type: 'contrat',
        filename: file.originalname,
        storageKey: key,
        uploadedBy: 'rh',
      },
    });
  }

  // Téléchargement générique (contrat ou fiche de prép) depuis le Casier RH
  // — pas de restriction par type, StaffGuard suffit au contrôle d'accès
  // (voir rh.controller.ts).
  async getFormateurDocumentStream(documentId: string) {
    const doc = await this.prisma.formateurDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document introuvable.');
    return this.storage.getObjectStream(doc.storageKey);
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
        this.prisma.formateur.findMany({
          orderBy: { nom: 'asc' },
          include: { groupes: { where: { typeCours: { not: null } }, take: 1 } },
        }),
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
      // typeCoursActuel : le type de cours déjà engagé par ce formateur, s'il
      // en encadre déjà un (voir assertFormateurTypeCoursCompatible) — sert
      // au front à ne proposer que des formateurs compatibles avec le type
      // du groupe à pourvoir.
      formateursDisponibles: formateurs.map((f) => ({
        id: f.id,
        nom: `${f.prenom} ${f.nom}`,
        typeCoursActuel: f.groupes[0]?.typeCours ?? null,
      })),
      reunionsAVenir: reunionsAVenir.map((r) => ({
        id: r.id,
        titre: r.titre,
        startAt: r.startAt,
      })),
    };
  }

  // ---- État financier global : Académie (Vue d'ensemble macro) ------------
  // Par type de cours (Groupe.typeCours) : CA théorique = apprenants actifs
  // × prix catalogue du type de cours (TarifFormation, saisi par la RH — 0
  // tant qu'il n'est pas renseigné, jamais un montant inventé), ventilé en
  // coût prévu (20%) / bénéfice net e-Staf (80%) — voir COUT_PCT_FORMATION.
  async getEtatFinancierFormation() {
    const groupes = await this.prisma.groupe.findMany({
      where: { typeCours: { not: null } },
      include: { apprenants: { select: { statutAgent: true } } },
    });

    const nbActifsParType = new Map<string, number>();
    for (const g of groupes) {
      if (!g.typeCours) continue;
      const actifs = g.apprenants.filter((a) => a.statutAgent !== 'inactif').length;
      nbActifsParType.set(g.typeCours, (nbActifsParType.get(g.typeCours) ?? 0) + actifs);
    }

    const typesCours = Array.from(nbActifsParType.keys()).sort();

    // Get-or-create le tarif de chaque type de cours réellement en usage —
    // même principe que POSTES_INFRASTRUCTURE_DEFAUT côté Production.
    const tarifs = await Promise.all(
      typesCours.map((typeCours) =>
        this.prisma.tarifFormation.upsert({
          where: { typeCours },
          create: { typeCours, prixFormation: 0 },
          update: {},
        }),
      ),
    );
    const prixParType = new Map(tarifs.map((t) => [t.typeCours, t.prixFormation]));

    return typesCours.map((typeCours) => {
      const nbApprenantsActifs = nbActifsParType.get(typeCours) ?? 0;
      const prixFormation = prixParType.get(typeCours) ?? 0;
      const caTheorique = round2(nbApprenantsActifs * prixFormation);
      return {
        typeCours,
        nbApprenantsActifs,
        prixFormation,
        caTheorique,
        coutPrevu: round2(caTheorique * COUT_PCT_FORMATION),
        beneficeNetEstaf: round2(caTheorique * MARGIN_PCT_FORMATION),
      };
    });
  }

  async updateTarifFormation(typeCours: string, prixFormation: number) {
    return this.prisma.tarifFormation.upsert({
      where: { typeCours },
      create: { typeCours, prixFormation },
      update: { prixFormation },
    });
  }

  // ---- Encaissements formation (Facturation & Encaissement) -----------------
  // Journal réel des versements reçus (voir EncaissementFormation) — comble
  // le vide identifié dans getEtatFinancierFormation, qui ne calcule qu'un
  // CA théorique. Saisi manuellement par la RH (pas de webhook, même
  // principe que la confirmation de paiement du pipeline d'admission).

  // Apprenants dont le groupe a un type de cours renseigné — seuls candidats
  // pertinents pour enregistrer un encaissement (sert au menu déroulant du
  // formulaire).
  async listApprenantsPourEncaissement() {
    const apprenants = await this.prisma.apprenant.findMany({
      where: { groupe: { typeCours: { not: null } } },
      include: { groupe: true },
      orderBy: { nom: 'asc' },
    });
    return apprenants.map((a) => ({
      id: a.id,
      matricule: a.matricule,
      nomComplet: `${a.prenom} ${a.nom}`,
      typeCours: a.groupe.typeCours as string,
    }));
  }

  async listEncaissements() {
    const encaissements = await this.prisma.encaissementFormation.findMany({
      include: { apprenant: { include: { groupe: true } } },
      orderBy: { jour: 'desc' },
    });
    return encaissements.map((e) => ({
      id: e.id,
      apprenantId: e.apprenantId,
      apprenantNom: `${e.apprenant.prenom} ${e.apprenant.nom}`,
      typeCours: e.apprenant.groupe.typeCours,
      montant: e.montant,
      jour: e.jour,
      moyenPaiement: e.moyenPaiement,
    }));
  }

  async createEncaissement(dto: CreateEncaissementDto) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { id: dto.apprenantId },
    });
    if (!apprenant) throw new NotFoundException('Apprenant introuvable.');
    const jour = new Date(dto.jour);
    jour.setUTCHours(0, 0, 0, 0);
    return this.prisma.encaissementFormation.create({
      data: {
        apprenantId: dto.apprenantId,
        montant: dto.montant,
        jour,
        moyenPaiement: dto.moyenPaiement ?? null,
      },
    });
  }

  // Édition complète (montant, jour, moyen de paiement, apprenant) — permet
  // à la RH de corriger une erreur de manipulation (mauvais apprenant
  // sélectionné, mauvaise date...), pas seulement le montant.
  async updateEncaissement(id: string, dto: UpdateEncaissementDto) {
    const existing = await this.prisma.encaissementFormation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Encaissement introuvable.');
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { id: dto.apprenantId },
    });
    if (!apprenant) throw new NotFoundException('Apprenant introuvable.');
    const jour = new Date(dto.jour);
    jour.setUTCHours(0, 0, 0, 0);
    return this.prisma.encaissementFormation.update({
      where: { id },
      data: {
        apprenantId: dto.apprenantId,
        montant: dto.montant,
        jour,
        moyenPaiement: dto.moyenPaiement ?? null,
      },
    });
  }

  // Suppression — pour une ligne saisie par erreur pure (mauvais apprenant,
  // doublon) qu'une simple correction ne suffit pas à réparer proprement.
  async deleteEncaissement(id: string) {
    const existing = await this.prisma.encaissementFormation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Encaissement introuvable.');
    await this.prisma.encaissementFormation.delete({ where: { id } });
    return { ok: true };
  }

  // Tableau "par type de cours" — nb d'inscrits actifs (même définition que
  // getEtatFinancierFormation) et total réellement encaissé, trié du plus
  // rentable au moins rentable pour que le type de cours en tête soit
  // directement identifiable comme celui qui a le plus rapporté.
  async getEncaissementsFormation() {
    const [groupes, encaissements] = await Promise.all([
      this.prisma.groupe.findMany({
        where: { typeCours: { not: null } },
        include: { apprenants: { select: { statutAgent: true } } },
      }),
      this.prisma.encaissementFormation.findMany({
        include: { apprenant: { include: { groupe: true } } },
      }),
    ]);

    const nbInscritsParType = new Map<string, number>();
    for (const g of groupes) {
      if (!g.typeCours) continue;
      const actifs = g.apprenants.filter((a) => a.statutAgent !== 'inactif').length;
      nbInscritsParType.set(g.typeCours, (nbInscritsParType.get(g.typeCours) ?? 0) + actifs);
    }

    const totalParType = new Map<string, number>();
    for (const e of encaissements) {
      const typeCours = e.apprenant.groupe.typeCours;
      if (!typeCours) continue;
      totalParType.set(typeCours, (totalParType.get(typeCours) ?? 0) + e.montant);
    }

    const typesCours = new Set([...nbInscritsParType.keys(), ...totalParType.keys()]);

    return Array.from(typesCours)
      .map((typeCours) => ({
        typeCours,
        nbInscrits: nbInscritsParType.get(typeCours) ?? 0,
        totalEncaisse: round2(totalParType.get(typeCours) ?? 0),
      }))
      .sort((a, b) => b.totalEncaisse - a.totalEncaisse);
  }

  // Comparatif hebdomadaire — 8 dernières semaines ISO ayant réellement un
  // encaissement, jamais une semaine fabriquée pour remplir le tableau.
  async getTendanceHebdomadaireFormation() {
    const encaissements = await this.prisma.encaissementFormation.findMany();
    const parSemaine = new Map<string, number>();
    for (const e of encaissements) {
      const semaine = isoWeekLabel(new Date(e.jour));
      parSemaine.set(semaine, (parSemaine.get(semaine) ?? 0) + e.montant);
    }
    return Array.from(parSemaine.entries())
      .map(([semaine, total]) => ({ semaine, totalEncaisse: round2(total) }))
      .sort((a, b) => (a.semaine < b.semaine ? -1 : 1))
      .slice(-8);
  }

  // Comparatif mensuel — mêmes règles (aucun mois fabriqué).
  async getTendanceMensuelleFormation() {
    const encaissements = await this.prisma.encaissementFormation.findMany();
    const parMois = new Map<string, number>();
    for (const e of encaissements) {
      const mois = moisLabel(new Date(e.jour));
      parMois.set(mois, (parMois.get(mois) ?? 0) + e.montant);
    }
    return Array.from(parMois.entries())
      .map(([periode, total]) => ({ periode, totalEncaisse: round2(total) }))
      .sort((a, b) => (a.periode < b.periode ? -1 : 1));
  }

  // ---- Paie Formateurs (page Paie & Commissions) -----------------------------
  // Miroir de ProductionService.getDetailPaieAgents, mais regroupé par type
  // de cours (BUCKETS_PAIE_FORMATEURS) plutôt que par contrat client, et
  // sans retenue/prime calculées automatiquement (pas de pointage réel par
  // formateur en base — voir PaiementFormateur). Matérialise (get-or-create)
  // une ligne PaiementFormateur par formateur et par période au premier
  // accès, base initiale = Formateur.tarifFixe.

  private async getOrCreatePaiementFormateur(formateurId: string, periode: string) {
    const existing = await this.prisma.paiementFormateur.findUnique({
      where: { formateurId_periode: { formateurId, periode } },
    });
    if (existing) return existing;
    const formateur = await this.prisma.formateur.findUnique({ where: { id: formateurId } });
    return this.prisma.paiementFormateur.create({
      data: { formateurId, periode, montantBase: formateur?.tarifFixe ?? 0 },
    });
  }

  // Heures réellement programmées (Seance.dureeMinutes, startAt renseigné)
  // sur un groupe pendant le mois de paie — seule donnée fiable pour "heures
  // effectuées" (la Presence issue des webhooks Daily n'est pas rattachée à
  // un Formateur par id, seulement à un rôle/displayName, trop fragile pour
  // servir de base de paie).
  private async heuresGroupeSurPeriode(groupeId: string, periode: string): Promise<number> {
    const [year, month] = periode.split('-').map(Number);
    const debut = new Date(Date.UTC(year, month - 1, 1));
    const fin = new Date(Date.UTC(year, month, 1));
    const seances = await this.prisma.seance.findMany({
      where: { groupeId, startAt: { gte: debut, lt: fin } },
    });
    return round2(seances.reduce((sum, s) => sum + s.dureeMinutes, 0) / 60);
  }

  async getTableauPaieFormateurs(periode?: string) {
    const p = periode ?? currentPeriode();
    const formateurs = await this.prisma.formateur.findMany({
      include: { groupes: true },
      orderBy: { nom: 'asc' },
    });

    const parBucket = new Map<string, typeof formateurs>();
    for (const f of formateurs) {
      const bucket = bucketFormateur(f.groupes);
      const list = parBucket.get(bucket) ?? [];
      list.push(f);
      parBucket.set(bucket, list);
    }

    return Promise.all(
      BUCKETS_PAIE_FORMATEURS.map(async (bucket) => {
        const list = parBucket.get(bucket) ?? [];
        let netAPayerTotal = 0;
        let payes = 0;
        for (const f of list) {
          const row = await this.getOrCreatePaiementFormateur(f.id, p);
          netAPayerTotal += row.montantBase + row.montantPrime - row.retenue;
          if (row.statut === 'paye') payes += 1;
        }
        return {
          bucket,
          nbFormateurs: list.length,
          netAPayerTotal: round2(netAPayerTotal),
          payes,
          enAttente: list.length - payes,
        };
      }),
    );
  }

  async getDetailPaieFormateurs(bucket: string, periode?: string) {
    const p = periode ?? currentPeriode();
    const formateurs = await this.prisma.formateur.findMany({
      include: { groupes: true },
      orderBy: { nom: 'asc' },
    });
    const filtres = formateurs.filter((f) => bucketFormateur(f.groupes) === bucket);

    const lignes = await Promise.all(
      filtres.map(async (f) => {
        const groupesDetail = await Promise.all(
          f.groupes.map(async (g) => ({
            groupeLabel: g.label,
            typeCours: g.typeCours,
            heuresEffectuees: await this.heuresGroupeSurPeriode(g.id, p),
          })),
        );
        const heuresTotal = round2(groupesDetail.reduce((sum, g) => sum + g.heuresEffectuees, 0));

        const row = await this.getOrCreatePaiementFormateur(f.id, p);
        const netAPayer = round2(row.montantBase + row.montantPrime - row.retenue);

        return {
          formateurId: f.id,
          matricule: f.matricule,
          formateurNom: `${f.prenom} ${f.nom}`,
          groupes: groupesDetail,
          heuresTotal,
          montantBase: row.montantBase,
          montantPrime: row.montantPrime,
          retenue: row.retenue,
          moyenPaiement: row.moyenPaiement,
          netAPayer,
          statut: row.statut,
          datePaiement: row.datePaiement,
        };
      }),
    );

    return { periode: p, bucket, lignes };
  }

  async updatePaiementFormateur(
    formateurId: string,
    periode: string,
    dto: UpdatePaiementFormateurDto,
  ) {
    const existing = await this.prisma.paiementFormateur.findUnique({
      where: { formateurId_periode: { formateurId, periode } },
    });
    if (!existing) throw new NotFoundException('Ligne de paie introuvable.');
    return this.prisma.paiementFormateur.update({
      where: { formateurId_periode: { formateurId, periode } },
      data: {
        montantBase: dto.montantBase ?? undefined,
        montantPrime: dto.montantPrime ?? undefined,
        retenue: dto.retenue ?? undefined,
        moyenPaiement: dto.moyenPaiement === undefined ? undefined : dto.moyenPaiement,
      },
    });
  }

  async payerFormateur(formateurId: string, periode: string) {
    const existing = await this.prisma.paiementFormateur.findUnique({
      where: { formateurId_periode: { formateurId, periode } },
    });
    if (!existing) throw new NotFoundException('Ligne de paie introuvable.');
    return this.prisma.paiementFormateur.update({
      where: { formateurId_periode: { formateurId, periode } },
      data: { statut: 'paye', datePaiement: new Date() },
    });
  }

  async payerTousFormateurs(bucket: string, periode: string) {
    const detail = await this.getDetailPaieFormateurs(bucket, periode);
    const formateurIds = detail.lignes.filter((l) => l.statut !== 'paye').map((l) => l.formateurId);
    await this.prisma.paiementFormateur.updateMany({
      where: { formateurId: { in: formateurIds }, periode },
      data: { statut: 'paye', datePaiement: new Date() },
    });
    return this.getDetailPaieFormateurs(bucket, periode);
  }

  // ---- Suivi des Agents d'Acquisition (commissions) -------------------------
  // Synchronisation automatique demandée le 2026-09-15 : le candidat indique
  // lui-même l'agent en passant le test (voir EvaluationService.
  // listAgentsAcquisition / createCandidat), et la conversion/réinscription
  // remonte ici sans ressaisie RH — confirmPayment recopie déjà
  // agentAcquisitionId sur l'Apprenant, renouvelerAbonnement journalise
  // chaque réinscription.

  async createAgentAcquisition(dto: CreateAgentAcquisitionDto) {
    return this.prisma.agentAcquisition.create({ data: { nom: dto.nom } });
  }

  // Un agent par ligne : testés (Candidat rattachés, quel que soit leur
  // statut), convertis (Apprenant créés, donc paiement confirmé) et
  // réinscriptions (Reinscription journalisées), chacun avec sa commission
  // fixe. "filleuls" liste les personnes recommandées par nom, pour le menu
  // déroulant du tableau RH — même liste que "testés", juste détaillée.
  async getSuiviAgentsAcquisition() {
    const agents = await this.prisma.agentAcquisition.findMany({
      include: {
        candidats: { select: { firstName: true, lastName: true } },
        apprenants: { include: { reinscriptions: true } },
      },
      orderBy: { nom: 'asc' },
    });

    return agents.map((a) => {
      const nbConvertis = a.apprenants.length;
      const nbReinscriptions = a.apprenants.reduce(
        (sum, ap) => sum + ap.reinscriptions.length,
        0,
      );
      return {
        id: a.id,
        nom: a.nom,
        nbTestes: a.candidats.length,
        nbConvertis,
        commissionConversion: round2(nbConvertis * COMMISSION_CONVERSION_EUR),
        nbReinscriptions,
        commissionReinscription: round2(nbReinscriptions * COMMISSION_REINSCRIPTION_EUR),
        filleuls: a.candidats.map((c) => `${c.firstName} ${c.lastName}`),
      };
    });
  }

  // Renouvellement d'abonnement FOL — trace l'événement (Reinscription) en
  // plus de mettre à jour l'échéance, pour que la commission de l'agent
  // d'acquisition se recalcule automatiquement (voir getSuiviAgentsAcquisition).
  async renouvelerAbonnement(matricule: string, dto: RenouvelerAbonnementDto) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant) throw new NotFoundException('Apprenant introuvable.');

    const nouvelleEcheance = new Date(dto.nouvelleEcheance);
    await this.prisma.reinscription.create({
      data: { apprenantId: apprenant.id, nouvelleEcheance },
    });
    return this.prisma.apprenant.update({
      where: { matricule },
      data: { abonnementExpireAt: nouvelleEcheance },
    });
  }
}
