import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import * as path from "path";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { StorageService } from "../common/storage.service";
import {
  credentialsBox,
  emailParagraph,
  escapeHtml,
  renderEmailHtml,
} from "../common/email-template";
import { agregerPointage, calculerPaieAgent } from "../common/paie-agent";
import { UpsertAgentDto } from "./dto/upsert-agent.dto";
import { UpsertSuiviJournalierDto } from "./dto/upsert-suivi-journalier.dto";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function currentPeriode(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Étiquette de semaine ISO ("AAAA-Wss") — même formule que côté Production
// (ProductionService.isoWeekLabel) et RH, dupliquée ici plutôt que partagée
// entre modules (convention du projet, voir currentPeriode/round2).
function isoWeekLabel(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function moisDuJour(jour: Date): string {
  return `${jour.getUTCFullYear()}-${String(jour.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Alphabet sans caractères ambigus (pas de 0/O, 1/l/I) — même génération que
// RhService.generateTemporaryPassword, dupliquée ici (convention du projet).
const TEMP_PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generateTemporaryPassword(length = 10): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => TEMP_PASSWORD_CHARS[b % TEMP_PASSWORD_CHARS.length]).join("");
}

// Un relevé journalier, tel que stocké (voir SuiviAgentJournalier).
interface Releve {
  jour: Date;
  realise: number | null;
  tauxAtteint: number;
  heuresTravaillees: number;
  remarques?: string | null;
}

// Agent de production (compte du 2026-10-22) — l'agent est la personne qui
// passe les appels pour les clients. Ce service porte les deux faces :
//
//   - côté RH (Portail > Agents, RhGuard) : annuaire, création de compte
//     avec mot de passe temporaire envoyé par e-mail, régénération des
//     identifiants, dépôt du contrat, saisie du relevé journalier, casier ;
//   - côté agent (Espace Agent, AgentGuard) : ses performances, son temps
//     travaillé, ses taux d'atteinte journalier/hebdo, son dossier, son
//     contrat et ses paiements.
//
// Même découpage que le couple RhService/CockpitService pour les formateurs,
// à ceci près que tout tient dans un module : les deux faces lisent
// exactement les mêmes lignes, autant garder les calculs au même endroit
// pour qu'un chiffre affiché à l'agent soit celui que la RH voit.
@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly storage: StorageService
  ) {}

  // ---- Compte & annuaire (RH) ----------------------------------------------

  // Numérotation séquentielle, préfixe distinct des apprenants
  // ("ETF-2026-") et des formateurs ("ETF-FORM-2026-") pour qu'aucun
  // matricule ne se chevauche — la recherche de compte au login
  // (AuthService.findAccount) s'appuie sur cette séparation.
  private async prochainMatricule(): Promise<string> {
    const prefixe = `ETF-AG-${new Date().getFullYear()}-`;
    const existants = await this.prisma.agent.findMany({
      where: { matricule: { startsWith: prefixe } },
      select: { matricule: true },
    });
    const max = existants.reduce((acc, a) => {
      const m = new RegExp(`^${prefixe}(\\d+)$`).exec(a.matricule);
      return m ? Math.max(acc, Number.parseInt(m[1], 10)) : acc;
    }, 0);
    return `${prefixe}${String(max + 1).padStart(4, "0")}`;
  }

  private envoyerIdentifiants(
    agent: { prenom: string; email: string; matricule: string },
    motDePasse: string,
    nouveau: boolean
  ) {
    const intro = nouveau
      ? "Un compte agent a été créé pour vous sur e-Staf."
      : "Voici vos nouveaux identifiants pour votre Espace Agent.";
    return this.email.send({
      to: agent.email,
      subject: nouveau
        ? "Bienvenue chez e-Staf — vos identifiants agent"
        : "Vos nouveaux identifiants e-Staf",
      text: `Bonjour ${agent.prenom},\n\n${intro}\n\nVos identifiants pour vous connecter à votre Espace Agent :\nMatricule : ${agent.matricule}\nMot de passe temporaire : ${motDePasse}\n\nNous vous conseillons de changer ce mot de passe dès votre première connexion.\n\nL'équipe e-Staf`,
      html: renderEmailHtml({
        title: nouveau ? "Bienvenue chez e-Staf" : "Vos nouveaux identifiants",
        preheader: "Vos identifiants pour votre Espace Agent",
        bodyHtml:
          emailParagraph(`Bonjour ${escapeHtml(agent.prenom)},`) +
          emailParagraph(intro) +
          credentialsBox([
            { label: "Matricule", value: agent.matricule },
            { label: "Mot de passe temporaire", value: motDePasse },
          ]) +
          emailParagraph(
            "Vous y suivez vos performances, votre temps travaillé, votre contrat et vos paiements. Changez ce mot de passe dès votre première connexion."
          ),
      }),
    });
  }

  // Un superviseurId fourni doit exister — même garde-fou que
  // ProductionService.createMission pour Mission.superviseurId.
  private async verifierSuperviseur(superviseurId: string | null | undefined) {
    if (!superviseurId) return;
    const superviseur = await this.prisma.superviseur.findUnique({
      where: { id: superviseurId },
    });
    if (!superviseur) throw new NotFoundException("Superviseur introuvable.");
  }

  async listAgents() {
    const agents = await this.prisma.agent.findMany({
      include: {
        superviseur: true,
        missions: {
          include: { contrat: true, superviseur: true },
          orderBy: { dateDebut: "desc" },
        },
        documents: { where: { type: "contrat" }, orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: [{ statut: "asc" }, { nom: "asc" }],
    });

    return agents.map((a) => {
      const missionActive = a.missions.find((m) => m.dateFin === null) ?? null;
      return {
        id: a.id,
        matricule: a.matricule,
        prenom: a.prenom,
        nom: a.nom,
        email: a.email,
        telephone: a.telephone,
        statut: a.statut,
        poste: a.poste,
        dateEmbauche: a.dateEmbauche,
        salaireBase: a.salaireBase,
        // Un compte sans mot de passe ne peut pas se connecter (agent créé
        // avant l'envoi des identifiants, ou import) — l'annuaire le dit
        // plutôt que de laisser croire que l'accès marche.
        peutSeConnecter: a.password !== null,
        contratDepose: a.documents.length > 0,
        missionsCount: a.missions.length,
        superviseurId: a.superviseurId,
        superviseurNom: a.superviseur ? `${a.superviseur.prenom} ${a.superviseur.nom}` : null,
        missionActive: missionActive
          ? {
              id: missionActive.id,
              clientNom: missionActive.contrat.clientNom,
              role: missionActive.role,
              dateDebut: missionActive.dateDebut,
              superviseurNom: missionActive.superviseur
                ? `${missionActive.superviseur.prenom} ${missionActive.superviseur.nom}`
                : null,
            }
          : null,
      };
    });
  }

  async createAgent(dto: UpsertAgentDto) {
    await this.verifierSuperviseur(dto.superviseurId);
    const matricule = await this.prochainMatricule();
    const temporaryPassword = generateTemporaryPassword();
    const agent = await this.prisma.agent.create({
      data: {
        matricule,
        prenom: dto.prenom,
        nom: dto.nom,
        email: dto.email,
        telephone: dto.telephone ?? null,
        statut: dto.statut ?? "essai",
        poste: dto.poste ?? null,
        dateEmbauche: dto.dateEmbauche ? new Date(dto.dateEmbauche) : null,
        salaireBase: dto.salaireBase ?? null,
        ribOuMobileMoney: dto.ribOuMobileMoney ?? null,
        moyenPaiementType: dto.moyenPaiementType ?? null,
        coordonneesVerifieesLe:
          dto.ribOuMobileMoney || dto.moyenPaiementType ? new Date() : null,
        superviseurId: dto.superviseurId ?? null,
        password: await bcrypt.hash(temporaryPassword, 10),
      },
    });

    await this.envoyerIdentifiants(agent, temporaryPassword, true);
    return agent;
  }

  async updateAgent(id: string, dto: UpsertAgentDto) {
    const existing = await this.prisma.agent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Agent introuvable.");
    await this.verifierSuperviseur(dto.superviseurId);

    // Passage à "inactif" : les sessions ouvertes doivent tomber tout de
    // suite (sessionToujoursValide refuse déjà le rôle agent inactif, mais
    // la révocation vaut aussi pour un éventuel retour à "actif" plus tard).
    const desactive = dto.statut === "inactif" && existing.statut !== "inactif";

    return this.prisma.agent.update({
      where: { id },
      data: {
        prenom: dto.prenom,
        nom: dto.nom,
        email: dto.email,
        telephone: dto.telephone === undefined ? undefined : dto.telephone,
        statut: dto.statut ?? undefined,
        poste: dto.poste === undefined ? undefined : dto.poste,
        dateEmbauche:
          dto.dateEmbauche === undefined
            ? undefined
            : dto.dateEmbauche
              ? new Date(dto.dateEmbauche)
              : null,
        salaireBase: dto.salaireBase === undefined ? undefined : dto.salaireBase,
        ribOuMobileMoney:
          dto.ribOuMobileMoney === undefined ? undefined : dto.ribOuMobileMoney,
        moyenPaiementType:
          dto.moyenPaiementType === undefined ? undefined : dto.moyenPaiementType,
        // Toute modification des coordonnées de paiement repasse par une
        // nouvelle vérification RH — jamais silencieusement conservée (même
        // règle que pour l'apprenant et le superviseur).
        coordonneesVerifieesLe:
          dto.ribOuMobileMoney !== undefined || dto.moyenPaiementType !== undefined
            ? new Date()
            : undefined,
        superviseurId: dto.superviseurId === undefined ? undefined : dto.superviseurId,
        sessionsRevoqueesAt: desactive ? new Date() : undefined,
      },
    });
  }

  // Réémet un mot de passe temporaire — même mécanique que
  // RhService.regenerateFormateurCredentials (les anciennes sessions
  // tombent, audit du 2026-09-28).
  async regenerateCredentials(id: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    if (agent.statut === "inactif") {
      throw new BadRequestException(
        "Cet agent est inactif : réactivez son compte avant de lui renvoyer des identifiants."
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    await this.prisma.agent.update({
      where: { id },
      data: {
        password: await bcrypt.hash(temporaryPassword, 10),
        sessionsRevoqueesAt: new Date(),
      },
    });

    await this.envoyerIdentifiants(agent, temporaryPassword, false);
    return { ok: true };
  }

  // Suppression réservée aux comptes créés par erreur : un agent qui a
  // réellement travaillé (mission, paie, document) n'est pas supprimable —
  // le passer en "inactif" coupe l'accès sans perdre l'historique, qui sert
  // au tableau de bord financier (même garde-fou que les connecteurs).
  async removeAgent(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { missions: true, documents: true },
    });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    if (agent.missions.length > 0) {
      throw new BadRequestException(
        "Cet agent a des missions enregistrées — passez son statut à « inactif » plutôt que de le supprimer."
      );
    }

    for (const doc of agent.documents) {
      await this.storage.deleteObject(doc.storageKey);
    }
    await this.prisma.agent.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Contrat & documents -------------------------------------------------

  async uploadContrat(id: string, file: Express.Multer.File) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException("Agent introuvable.");

    const extension = path.extname(file.originalname) || "";
    const key = `agents/${agent.id}/contrat/${Date.now()}${extension}`;
    await this.storage.uploadBuffer(
      key,
      file.buffer,
      file.mimetype || "application/octet-stream"
    );
    return this.prisma.agentDocument.create({
      data: {
        agentId: agent.id,
        type: "contrat",
        filename: file.originalname,
        storageKey: key,
        uploadedBy: "rh",
      },
    });
  }

  // Téléchargement côté RH (casier) — StaffGuard suffit au contrôle d'accès,
  // voir agents.controller.ts.
  async getDocumentStream(documentId: string) {
    const doc = await this.prisma.agentDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException("Document introuvable.");
    return this.storage.getObjectStream(doc.storageKey);
  }

  // Téléchargement par l'agent lui-même : le document doit lui appartenir —
  // sinon un agent connecté pourrait lire le contrat d'un collègue avec un
  // simple identifiant de document.
  async getMonDocumentStream(matricule: string, documentId: string) {
    const doc = await this.prisma.agentDocument.findUnique({
      where: { id: documentId },
      include: { agent: { select: { matricule: true } } },
    });
    if (!doc || doc.agent.matricule !== matricule) {
      throw new NotFoundException("Document introuvable.");
    }
    return this.storage.getObjectStream(doc.storageKey);
  }

  // ---- Relevé journalier (saisie RH) ---------------------------------------

  // Un relevé par mission et par jour. Le taux d'atteinte est déduit du
  // réalisé quand une cible existe sur la mission
  // (Mission.objectifJournalier) ; sinon il doit être fourni tel quel — on
  // ne devine jamais un objectif absent.
  async upsertSuiviJournalier(missionId: string, dto: UpsertSuiviJournalierDto) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException("Mission introuvable.");

    const jour = new Date(dto.jour);
    if (Number.isNaN(jour.getTime())) throw new BadRequestException("Date invalide.");
    jour.setUTCHours(0, 0, 0, 0);

    const cible = mission.objectifJournalier;
    const tauxCalcule =
      dto.realise !== undefined && dto.realise !== null && cible
        ? round2((dto.realise / cible) * 100)
        : null;
    const tauxAtteint = tauxCalcule ?? dto.tauxAtteint;
    if (tauxAtteint === undefined) {
      throw new BadRequestException(
        "Renseignez le taux d'atteinte, ou fixez un objectif journalier sur la mission pour qu'il soit calculé depuis le réalisé."
      );
    }

    return this.prisma.suiviAgentJournalier.upsert({
      where: { missionId_jour: { missionId, jour } },
      create: {
        missionId,
        jour,
        realise: dto.realise ?? null,
        tauxAtteint,
        heuresTravaillees: dto.heuresTravaillees ?? 0,
        remarques: dto.remarques ?? null,
      },
      update: {
        realise: dto.realise === undefined ? undefined : dto.realise,
        tauxAtteint,
        heuresTravaillees:
          dto.heuresTravaillees === undefined ? undefined : dto.heuresTravaillees,
        remarques: dto.remarques === undefined ? undefined : dto.remarques,
      },
    });
  }

  async supprimerSuiviJournalier(id: string) {
    const releve = await this.prisma.suiviAgentJournalier.findUnique({ where: { id } });
    if (!releve) throw new NotFoundException("Relevé introuvable.");
    await this.prisma.suiviAgentJournalier.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Calculs de performance (partagés RH / Espace Agent) -----------------

  // Série journalière des 30 derniers relevés (ordre chronologique) — le
  // graphique "objectif atteint par jour" de l'Espace Agent, pendant
  // individuel de celui du contrat (ObjectifJournalier).
  private serieJournaliere(releves: Releve[]) {
    return [...releves]
      .sort((a, b) => a.jour.getTime() - b.jour.getTime())
      .slice(-30)
      .map((r) => ({
        jour: r.jour,
        realise: r.realise,
        tauxAtteint: r.tauxAtteint,
        heuresTravaillees: r.heuresTravaillees,
      }));
  }

  // Comparatif hebdomadaire (8 dernières semaines ISO ayant au moins un
  // relevé). Le taux de la semaine vient de la cible hebdo quand elle
  // existe (somme des réalisés / objectifHebdo) — sinon de la moyenne des
  // taux journaliers, seule lecture honnête sans cible hebdo fixée.
  private comparatifHebdo(releves: Releve[], objectifHebdo: number | null) {
    const parSemaine = new Map<
      string,
      { total: number; count: number; realise: number; heures: number; realiseConnu: boolean }
    >();
    for (const r of releves) {
      const semaine = isoWeekLabel(r.jour);
      const e =
        parSemaine.get(semaine) ??
        { total: 0, count: 0, realise: 0, heures: 0, realiseConnu: false };
      e.total += r.tauxAtteint;
      e.count += 1;
      e.heures += r.heuresTravaillees;
      if (r.realise !== null) {
        e.realise += r.realise;
        e.realiseConnu = true;
      }
      parSemaine.set(semaine, e);
    }

    return Array.from(parSemaine.entries())
      .map(([semaine, e]) => ({
        semaine,
        joursSaisis: e.count,
        realise: e.realiseConnu ? e.realise : null,
        heuresTravaillees: round2(e.heures),
        tauxAtteint:
          objectifHebdo && e.realiseConnu
            ? round2((e.realise / objectifHebdo) * 100)
            : round2(e.total / e.count),
      }))
      .sort((a, b) => (a.semaine < b.semaine ? -1 : 1))
      .slice(-8);
  }

  // Temps travaillé — somme des heures des relevés journaliers, sur la
  // semaine ISO en cours, le mois en cours et l'ensemble des relevés. Le
  // pointage hebdo (retards, absences, heures sup) reste à part : ce sont
  // des corrections de paie, pas du temps de présence (voir
  // SuiviAgentHebdo).
  private tempsTravaille(releves: Releve[]) {
    const semaineCourante = isoWeekLabel(new Date());
    const moisCourant = currentPeriode();
    const somme = (liste: Releve[]) => round2(liste.reduce((s, r) => s + r.heuresTravaillees, 0));
    const joursTravailles = releves.filter((r) => r.heuresTravaillees > 0);
    return {
      semaine: semaineCourante,
      heuresSemaine: somme(releves.filter((r) => isoWeekLabel(r.jour) === semaineCourante)),
      periode: moisCourant,
      heuresMois: somme(releves.filter((r) => moisDuJour(r.jour) === moisCourant)),
      heuresTotal: somme(releves),
      joursTravailles: joursTravailles.length,
      moyenneHeuresParJour:
        joursTravailles.length > 0 ? round2(somme(joursTravailles) / joursTravailles.length) : null,
    };
  }

  // Synthèse des 30 derniers jours saisis : taux moyen et nombre de jours
  // où l'objectif a été atteint (>= 100%).
  private syntheseObjectifs(releves: Releve[]) {
    const derniers = this.serieJournaliere(releves);
    if (derniers.length === 0) {
      return { joursSaisis: 0, tauxMoyen: null, joursObjectifAtteint: 0 };
    }
    return {
      joursSaisis: derniers.length,
      tauxMoyen: round2(derniers.reduce((s, r) => s + r.tauxAtteint, 0) / derniers.length),
      joursObjectifAtteint: derniers.filter((r) => r.tauxAtteint >= 100).length,
    };
  }

  // ---- Espace Agent --------------------------------------------------------

  private async agentParMatricule(matricule: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { matricule },
      include: {
        superviseur: true,
        documents: { orderBy: { createdAt: "desc" } },
        missions: {
          include: {
            contrat: true,
            superviseur: true,
            suivisHebdo: { orderBy: { semaine: "desc" } },
            suivisJournaliers: true,
          },
          orderBy: { dateDebut: "desc" },
        },
      },
    });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    return agent;
  }

  async getDashboard(matricule: string) {
    const agent = await this.agentParMatricule(matricule);
    const missionActive = agent.missions.find((m) => m.dateFin === null) ?? null;
    // Hors mission : l'agent voit l'historique de sa dernière mission
    // plutôt qu'un tableau de bord vide (il reste salarié entre deux
    // clients).
    const mission = missionActive ?? agent.missions[0] ?? null;
    const releves: Releve[] = mission ? mission.suivisJournaliers : [];
    const aujourdhui = new Date();
    aujourdhui.setUTCHours(0, 0, 0, 0);
    const releveDuJour = releves.find((r) => r.jour.getTime() === aujourdhui.getTime()) ?? null;
    const dernierSuiviHebdo = mission?.suivisHebdo[0] ?? null;

    return {
      matricule: agent.matricule,
      prenom: agent.prenom,
      nom: agent.nom,
      poste: agent.poste,
      statut: agent.statut,
      dateEmbauche: agent.dateEmbauche,
      mission: mission
        ? {
            id: mission.id,
            clientNom: mission.contrat.clientNom,
            role: mission.role,
            dateDebut: mission.dateDebut,
            dateFin: mission.dateFin,
            active: mission.dateFin === null,
            superviseurNom: mission.superviseur
              ? `${mission.superviseur.prenom} ${mission.superviseur.nom}`
              : null,
            objectifJournalier: mission.objectifJournalier,
            objectifHebdo: mission.objectifHebdo,
            qualityScore: mission.qualityScore,
          }
        : null,
      releveDuJour: releveDuJour
        ? {
            jour: releveDuJour.jour,
            realise: releveDuJour.realise,
            tauxAtteint: releveDuJour.tauxAtteint,
            heuresTravaillees: releveDuJour.heuresTravaillees,
          }
        : null,
      tauxJournaliers: this.serieJournaliere(releves),
      comparatifHebdo: this.comparatifHebdo(releves, mission?.objectifHebdo ?? null),
      tempsTravaille: this.tempsTravaille(releves),
      synthese: this.syntheseObjectifs(releves),
      // Pointage et métriques de la dernière semaine renseignée par le
      // superviseur — null tant qu'aucun suivi hebdo n'existe.
      pointageHebdo: dernierSuiviHebdo
        ? {
            semaine: dernierSuiviHebdo.semaine,
            heuresRetardCumulees: dernierSuiviHebdo.heuresRetardCumulees,
            heuresAbsenceNonJustifiee: dernierSuiviHebdo.heuresAbsenceNonJustifiee,
            heuresSupValidees: dernierSuiviHebdo.heuresSupValidees,
            nbRetards: dernierSuiviHebdo.nbRetards,
            tauxAbsence: dernierSuiviHebdo.tauxAbsence,
          }
        : null,
      performanceHebdo: dernierSuiviHebdo
        ? {
            semaine: dernierSuiviHebdo.semaine,
            concretisations: dernierSuiviHebdo.concretisations,
            nbVentes: dernierSuiviHebdo.nbVentes,
            rdvValides: dernierSuiviHebdo.rdvValides,
            caRealise: dernierSuiviHebdo.caRealise,
            remarques: dernierSuiviHebdo.remarques,
          }
        : null,
    };
  }

  // Dossier de l'agent — l'équivalent du "Casier" côté RH, vu par l'agent :
  // son identité, son contrat de travail déposé par la RH, et l'historique
  // de ses missions.
  async getDossier(matricule: string) {
    const agent = await this.agentParMatricule(matricule);
    return {
      matricule: agent.matricule,
      prenom: agent.prenom,
      nom: agent.nom,
      email: agent.email,
      telephone: agent.telephone,
      poste: agent.poste,
      statut: agent.statut,
      dateEmbauche: agent.dateEmbauche,
      salaireBase: agent.salaireBase,
      // Superviseur rattaché à l'agent — permanent, indépendant de la
      // mission (voir Agent.superviseurId), distinct de
      // missions[].superviseurNom qui ne vaut que pour la mission.
      superviseurNom: agent.superviseur
        ? `${agent.superviseur.prenom} ${agent.superviseur.nom}`
        : null,
      coordonneesPaiement:
        agent.moyenPaiementType && agent.ribOuMobileMoney
          ? {
              type: agent.moyenPaiementType,
              numero: agent.ribOuMobileMoney,
              verifieLe: agent.coordonneesVerifieesLe,
            }
          : null,
      contrat: agent.documents.find((d) => d.type === "contrat") ?? null,
      autresDocuments: agent.documents.filter((d) => d.type !== "contrat"),
      missions: agent.missions.map((m) => ({
        id: m.id,
        clientNom: m.contrat.clientNom,
        role: m.role,
        dateDebut: m.dateDebut,
        dateFin: m.dateFin,
        superviseurNom: m.superviseur ? `${m.superviseur.prenom} ${m.superviseur.nom}` : null,
        qualityScore: m.qualityScore,
        tarifNegocie: m.tarifNegocie,
        objectifJournalier: m.objectifJournalier,
        objectifHebdo: m.objectifHebdo,
        synthese: this.syntheseObjectifs(m.suivisJournaliers),
      })),
    };
  }

  // Paie de l'agent — lecture seule des lignes réellement établies par la
  // RH (PaiementAgent). Contrairement à la vue RH, rien n'est matérialisé
  // ici : l'agent ne crée pas sa propre ligne de paie, il lit celles qui
  // existent. Le net à payer passe par la même formule que la RH (voir
  // common/paie-agent.ts).
  async getPaiements(matricule: string) {
    const agent = await this.agentParMatricule(matricule);
    const missionsById = new Map(agent.missions.map((m) => [m.id, m]));
    const paiements = await this.prisma.paiementAgent.findMany({
      where: { missionId: { in: [...missionsById.keys()] } },
      orderBy: { periode: "desc" },
    });

    const lignes = paiements.map((p) => {
      const mission = missionsById.get(p.missionId)!;
      const { heuresAbsence, heuresRetard, heuresSup } = agregerPointage(
        mission.suivisHebdo,
        p.periode
      );
      const { tauxHoraire, retenue, primeHeuresSup, netAPayer } = calculerPaieAgent({
        tarif: mission.tarifNegocie ?? agent.salaireBase ?? 0,
        montantBase: p.montantBase,
        montantPrime: p.montantPrime,
        heuresAbsence,
        heuresRetard,
        heuresSup,
      });
      return {
        periode: p.periode,
        clientNom: mission.contrat.clientNom,
        role: mission.role,
        tauxHoraire,
        montantBase: p.montantBase,
        montantPrime: p.montantPrime,
        heuresAbsence,
        heuresRetard,
        heuresSup,
        retenue,
        primeHeuresSup,
        netAPayer,
        moyenPaiement: p.moyenPaiement,
        statut: p.statut,
        datePaiement: p.datePaiement,
      };
    });

    return {
      lignes,
      totalPaye: round2(
        lignes.filter((l) => l.statut === "paye").reduce((s, l) => s + l.netAPayer, 0)
      ),
      totalEnAttente: round2(
        lignes.filter((l) => l.statut !== "paye").reduce((s, l) => s + l.netAPayer, 0)
      ),
      coordonneesPaiement:
        agent.moyenPaiementType && agent.ribOuMobileMoney
          ? {
              type: agent.moyenPaiementType,
              numero: agent.ribOuMobileMoney,
              verifieLe: agent.coordonneesVerifieesLe,
            }
          : null,
    };
  }

  // ---- Casier Agent (RH) ---------------------------------------------------

  // Même fiche que l'Espace Agent, plus ce que seule la RH voit : les
  // relevés journaliers détaillés (saisissables/corrigeables) et l'état des
  // paiements. Un seul aller-retour pour la page, comme getFormateurCasier.
  async getAgentCasier(id: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException("Agent introuvable.");

    const [dossier, dashboard, paiements] = await Promise.all([
      this.getDossier(agent.matricule),
      this.getDashboard(agent.matricule),
      this.getPaiements(agent.matricule),
    ]);

    const missionActive = await this.prisma.mission.findFirst({
      where: { agentId: agent.id, dateFin: null },
      include: {
        contrat: true,
        suivisJournaliers: { orderBy: { jour: "desc" }, take: 30 },
      },
    });

    return {
      id: agent.id,
      ...dossier,
      superviseurId: agent.superviseurId,
      peutSeConnecter: agent.password !== null,
      tauxJournaliers: dashboard.tauxJournaliers,
      comparatifHebdo: dashboard.comparatifHebdo,
      tempsTravaille: dashboard.tempsTravaille,
      synthese: dashboard.synthese,
      pointageHebdo: dashboard.pointageHebdo,
      performanceHebdo: dashboard.performanceHebdo,
      paiements: paiements.lignes,
      // Saisie du relevé journalier : seule la mission active est
      // alimentable (on ne saisit pas de production sur une mission close).
      missionActive: missionActive
        ? {
            id: missionActive.id,
            clientNom: missionActive.contrat.clientNom,
            role: missionActive.role,
            objectifJournalier: missionActive.objectifJournalier,
            objectifHebdo: missionActive.objectifHebdo,
            releves: missionActive.suivisJournaliers.map((r) => ({
              id: r.id,
              jour: r.jour,
              realise: r.realise,
              tauxAtteint: r.tauxAtteint,
              heuresTravaillees: r.heuresTravaillees,
              remarques: r.remarques,
            })),
          }
        : null,
    };
  }
}
