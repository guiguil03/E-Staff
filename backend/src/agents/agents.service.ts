import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import * as path from "path";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { StorageService } from "../common/storage.service";
import { DailyService } from "../classe-virtuelle/daily.service";
import { ouvrirSalleVisio } from "../common/salle-visio";
import {
  credentialsBox,
  emailParagraph,
  escapeHtml,
  renderEmailHtml,
} from "../common/email-template";
import { agregerPointage, calculerPaieAgent, isoWeekToMonday } from "../common/paie-agent";
import {
  cartesRemuneration,
  type JourSuivi,
  niveauAlerte,
  SEUIL_ALERTE_ROUGE,
  SEUIL_FEU_VERT,
  STATUTS_PRESENCE,
} from "../common/suivi-agent";
import { UpsertAgentDto } from "./dto/upsert-agent.dto";
import { LierCandidatDto } from "./dto/lier-candidat.dto";
import { NoteClientDto } from "./dto/note-client.dto";
import { SaisieJourneeDto } from "./dto/saisie-journee.dto";
import { UpsertSuiviJournalierDto } from "./dto/upsert-suivi-journalier.dto";
import { ValiderJourneeDto } from "./dto/valider-journee.dto";

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
    private readonly storage: StorageService,
    private readonly daily: DailyService
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

  async listAgents() {
    const agents = await this.prisma.agent.findMany({
      include: {
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
        password: await bcrypt.hash(temporaryPassword, 10),
      },
    });

    await this.envoyerIdentifiants(agent, temporaryPassword, true);
    return agent;
  }

  async updateAgent(id: string, dto: UpsertAgentDto) {
    const existing = await this.prisma.agent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Agent introuvable.");

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
        heuresPanne: dto.heuresPanne ?? 0,
        remarques: dto.remarques ?? null,
        // Saisi par la RH : pas de validation à attendre.
        statutValidation: "valide",
        valideLe: new Date(),
      },
      update: {
        realise: dto.realise === undefined ? undefined : dto.realise,
        tauxAtteint,
        heuresTravaillees:
          dto.heuresTravaillees === undefined ? undefined : dto.heuresTravaillees,
        heuresPanne: dto.heuresPanne === undefined ? undefined : dto.heuresPanne,
        remarques: dto.remarques === undefined ? undefined : dto.remarques,
        statutValidation: "valide",
        valideLe: new Date(),
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

  // ---- Suivi d'activité saisi par l'agent ----------------------------------

  private aujourdhuiUtc(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  async changerStatutPresence(matricule: string, statut: string) {
    const agent = await this.prisma.agent.findUnique({ where: { matricule } });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    if (!(STATUTS_PRESENCE as readonly string[]).includes(statut)) {
      throw new BadRequestException("Statut inconnu.");
    }
    const maj = await this.prisma.agent.update({
      where: { id: agent.id },
      data: { statutPresence: statut, statutPresenceDepuis: new Date() },
    });
    return { statut: maj.statutPresence, depuis: maj.statutPresenceDepuis };
  }

  // Tableau de bord de saisie : saisie du jour, récap de la semaine, courbes
  // heures/pannes/taux de la semaine, jauge du mois, historique et les
  // quatre cartes de rémunération. Tout vient des SuiviAgentJournalier de
  // la mission (les mêmes lignes que la RH valide).
  async getSuiviActivite(matricule: string) {
    const agent = await this.agentParMatricule(matricule);
    const mission = agent.missions.find((m) => m.dateFin === null) ?? null;
    const now = new Date();
    const aujourdhui = this.aujourdhuiUtc();
    const periode = moisDuJour(aujourdhui);
    const semaine = isoWeekLabel(aujourdhui);

    const appelsDuJour = await this.prisma.appelAgent.findMany({
      where: { agentId: agent.id, debut: { gte: aujourdhui } },
      orderBy: { debut: "asc" },
    });
    const appelEnCours = appelsDuJour.find((a) => a.fin === null) ?? null;

    // Échanges avec le superviseur : consignes (individuelles ou diffusées à
    // toute son équipe), réunions où l'agent est invité, alerte en cours.
    const superviseurId = mission?.superviseurId ?? null;
    const [messagesRecus, reunionsInvite, alerteOuverte] = await Promise.all([
      this.prisma.messageSuperviseur.findMany({
        where: {
          OR: [
            { agentId: agent.id },
            ...(superviseurId ? [{ agentId: null, superviseurId }] : []),
          ],
        },
        include: { superviseur: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      this.prisma.reunionSuperviseur.findMany({
        where: {
          participants: { some: { agentId: agent.id } },
          debut: { gte: new Date(Date.now() - 3600_000) },
        },
        include: { superviseur: true },
        orderBy: { debut: "asc" },
        take: 10,
      }),
      this.prisma.alerteAgent.findFirst({ where: { agentId: agent.id, traiteeLe: null } }),
    ]);
    const secondesAppels = appelsDuJour
      .filter((a) => a.fin !== null)
      .reduce((sum, a) => sum + Math.round((a.fin!.getTime() - a.debut.getTime()) / 1000), 0);

    const jours: JourSuivi[] = (mission?.suivisJournaliers ?? []).map((r) => ({
      jour: r.jour,
      tauxAtteint: r.tauxAtteint,
      heuresTravaillees: r.heuresTravaillees,
      heuresPanne: r.heuresPanne,
      statutValidation: r.statutValidation,
    }));

    const detail = (r: NonNullable<typeof mission>["suivisJournaliers"][number]) => ({
      id: r.id,
      jour: r.jour,
      realise: r.realise,
      tauxAtteint: r.tauxAtteint,
      alerte: niveauAlerte(r.tauxAtteint),
      heuresTravaillees: r.heuresTravaillees,
      heuresPanne: r.heuresPanne,
      remarques: r.remarques,
      statutValidation: r.statutValidation,
      commentaireSuperviseur: r.commentaireSuperviseur,
    });

    const releves = [...(mission?.suivisJournaliers ?? [])].sort(
      (a, b) => a.jour.getTime() - b.jour.getTime()
    );
    const duJour = releves.find((r) => r.jour.getTime() === aujourdhui.getTime()) ?? null;
    const deLaSemaine = releves.filter((r) => isoWeekLabel(r.jour) === semaine);
    const duMois = releves.filter((r) => moisDuJour(r.jour) === periode);

    // Courbe de la semaine : un point par jour, lundi -> dimanche (les jours
    // sans saisie restent à zéro — jamais de chiffre inventé).
    const lundi = isoWeekToMonday(semaine);
    const courbeSemaine = Array.from({ length: 7 }, (_, i) => {
      const jour = new Date(lundi);
      jour.setUTCDate(lundi.getUTCDate() + i);
      const r = deLaSemaine.find((x) => x.jour.getTime() === jour.getTime());
      return {
        jour,
        heures: r?.heuresTravaillees ?? 0,
        panne: r?.heuresPanne ?? 0,
        tauxAtteint: r?.tauxAtteint ?? null,
        alerte: r ? niveauAlerte(r.tauxAtteint) : null,
      };
    });

    // Jauge mensuelle 0-100 % : taux moyen des journées saisies du mois
    // rapporté au seuil de feu vert (5 % = jauge pleine).
    const tauxMoyenMois =
      duMois.length > 0 ? round2(duMois.reduce((s, r) => s + r.tauxAtteint, 0) / duMois.length) : null;

    return {
      agent: {
        statutPresence: agent.statutPresence,
        statutPresenceDepuis: agent.statutPresenceDepuis,
      },
      assistance: {
        superviseurNom: mission?.superviseur
          ? `${mission.superviseur.prenom} ${mission.superviseur.nom}`
          : null,
        superviseurEmail: mission?.superviseur?.email ?? null,
        supportEmail: process.env.SUPPORT_EMAIL ?? null,
        // Numéros du support, renseignés par variables d'environnement
        // (chiffres uniquement côté WhatsApp, format international).
        supportTelephone: process.env.SUPPORT_PHONE ?? null,
        supportWhatsapp: process.env.SUPPORT_WHATSAPP?.replace(/\D/g, "") || null,
      },
      // Derniers commentaires du superviseur (posés à la validation d'une
      // journée), du plus récent au plus ancien.
      commentairesSuperviseur: [...releves]
        .filter((r) => r.commentaireSuperviseur)
        .reverse()
        .slice(0, 5)
        .map((r) => ({
          jour: r.jour,
          commentaire: r.commentaireSuperviseur,
          alerte: niveauAlerte(r.tauxAtteint),
        })),
      salleBriefDisponible: Boolean(mission),
      messages: messagesRecus.map((m) => ({
        id: m.id,
        texte: m.texte,
        createdAt: m.createdAt,
        de: `${m.superviseur.prenom} ${m.superviseur.nom}`,
        diffusion: m.agentId === null,
      })),
      reunions: reunionsInvite.map((r) => ({
        id: r.id,
        titre: r.titre,
        debut: r.debut,
        dureeMin: r.dureeMin,
        type: r.type,
        de: `${r.superviseur.prenom} ${r.superviseur.nom}`,
      })),
      alerteOuverte: alerteOuverte ? { id: alerteOuverte.id, creeeLe: alerteOuverte.creeeLe } : null,
      mission: mission
        ? {
            id: mission.id,
            clientNom: mission.contrat.clientNom,
            objectifJournalier: mission.objectifJournalier,
          }
        : null,
      // Chrono d'appel : `debut` de l'appel en cours (le front calcule le
      // temps écoulé), et le cumul des appels terminés aujourd'hui.
      appels: {
        enCours: appelEnCours ? { id: appelEnCours.id, debut: appelEnCours.debut } : null,
        terminesAujourdhui: appelsDuJour.filter((a) => a.fin !== null).length,
        secondesAujourdhui: secondesAppels,
      },
      aujourdhui,
      seuils: { rouge: SEUIL_ALERTE_ROUGE, vert: SEUIL_FEU_VERT },
      saisieDuJour: duJour ? detail(duJour) : null,
      recapSemaine: {
        semaine,
        heures: round2(deLaSemaine.reduce((s, r) => s + r.heuresTravaillees, 0)),
        panne: round2(deLaSemaine.reduce((s, r) => s + r.heuresPanne, 0)),
        ventesValidees: deLaSemaine
          .filter((r) => r.statutValidation === "valide")
          .reduce((s, r) => s + (r.realise ?? 0), 0),
      },
      courbeSemaine,
      jaugeMensuelle: {
        periode,
        tauxMoyen: tauxMoyenMois,
        pourcentage:
          tauxMoyenMois === null
            ? null
            : Math.min(100, Math.round((tauxMoyenMois / SEUIL_FEU_VERT) * 100)),
      },
      cartes: cartesRemuneration({ jours, periode, salaireBase: agent.salaireBase, now }),
      historique: [...releves].reverse().slice(0, 31).map(detail),
    };
  }

  // L'agent saisit sa propre journée (toujours le jour courant). Le
  // pourcentage atteint est calculé depuis l'objectif journalier de la
  // mission ; sans objectif fixé on refuse plutôt que d'inventer un taux.
  // Une journée déjà validée est verrouillée.
  async saisirMaJournee(matricule: string, dto: SaisieJourneeDto) {
    const agent = await this.agentParMatricule(matricule);
    const mission = agent.missions.find((m) => m.dateFin === null);
    if (!mission) {
      throw new BadRequestException("Aucune mission active : saisie impossible.");
    }
    if (!mission.objectifJournalier) {
      throw new BadRequestException(
        "Aucun objectif journalier fixé sur votre mission : demandez à la RH de le renseigner."
      );
    }
    const jour = this.aujourdhuiUtc();
    const existant = mission.suivisJournaliers.find((r) => r.jour.getTime() === jour.getTime());
    if (existant?.statutValidation === "valide") {
      throw new BadRequestException(
        "Cette journée a été validée par votre superviseur : elle n'est plus modifiable. Contactez la RH pour demander une modification."
      );
    }

    const tauxAtteint = round2((dto.realise / mission.objectifJournalier) * 100);
    const donnees = {
      realise: dto.realise,
      tauxAtteint,
      heuresTravaillees: dto.heuresTravaillees,
      heuresPanne: dto.heuresPanne,
      remarques: dto.remarques?.trim() || null,
    };
    const releve = await this.prisma.suiviAgentJournalier.upsert({
      where: { missionId_jour: { missionId: mission.id, jour } },
      create: { missionId: mission.id, jour, ...donnees },
      // Une journée renvoyée pour correction repasse « à valider » dès que
      // l'agent la ressaisit.
      update: { ...donnees, statutValidation: "a_valider" },
    });
    return {
      id: releve.id,
      tauxAtteint,
      alerte: niveauAlerte(tauxAtteint),
      statutValidation: releve.statutValidation,
    };
  }

  // Chrono d'appel : un seul appel ouvert à la fois. Démarrer alors qu'un
  // appel est déjà en cours renvoie celui-ci (double clic, deuxième onglet)
  // au lieu d'en ouvrir un second.
  async demarrerAppel(matricule: string) {
    const agent = await this.prisma.agent.findUnique({ where: { matricule } });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    const enCours = await this.prisma.appelAgent.findFirst({
      where: { agentId: agent.id, fin: null },
    });
    if (enCours) return { id: enCours.id, debut: enCours.debut };
    const appel = await this.prisma.appelAgent.create({ data: { agentId: agent.id } });
    return { id: appel.id, debut: appel.debut };
  }

  async terminerAppel(matricule: string) {
    const agent = await this.prisma.agent.findUnique({ where: { matricule } });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    const enCours = await this.prisma.appelAgent.findFirst({
      where: { agentId: agent.id, fin: null },
    });
    if (!enCours) throw new BadRequestException("Aucun appel en cours.");
    const fin = new Date();
    await this.prisma.appelAgent.update({ where: { id: enCours.id }, data: { fin } });
    return { secondes: Math.round((fin.getTime() - enCours.debut.getTime()) / 1000) };
  }

  // Bouton d'alerte : l'agent signale qu'il a besoin d'assistance. Une seule
  // alerte ouverte à la fois — un second clic renvoie la même (le superviseur
  // la voit déjà), au lieu d'empiler des signalements.
  async signalerAssistance(matricule: string, message?: string | null) {
    const agent = await this.prisma.agent.findUnique({ where: { matricule } });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    const ouverte = await this.prisma.alerteAgent.findFirst({
      where: { agentId: agent.id, traiteeLe: null },
    });
    if (ouverte) return { id: ouverte.id, creeeLe: ouverte.creeeLe, dejaOuverte: true };
    const alerte = await this.prisma.alerteAgent.create({
      data: { agentId: agent.id, message: message?.trim() || null },
    });
    return { id: alerte.id, creeeLe: alerte.creeeLe, dejaOuverte: false };
  }

  // Rejoindre une réunion planifiée par le superviseur — réservé aux agents
  // invités.
  async salleReunionAgent(matricule: string, reunionId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { matricule } });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    const reunion = await this.prisma.reunionSuperviseur.findFirst({
      where: { id: reunionId, participants: { some: { agentId: agent.id } } },
    });
    if (!reunion) throw new NotFoundException("Réunion introuvable.");
    return ouvrirSalleVisio(
      this.daily,
      {
        roomId: `reunion-${reunion.id}`,
        roomName: reunion.roomName,
        roomUrl: reunion.roomUrl,
        dureeValiditeSecondes: 30 * 86400,
        persister: (roomName, roomUrl) =>
          this.prisma.reunionSuperviseur.update({
            where: { id: reunion.id },
            data: { roomName, roomUrl },
          }),
      },
      { userId: `agent-${agent.id}`, userName: `${agent.prenom} ${agent.nom}`, owner: false }
    );
  }

  // Salle de brief : une salle Daily persistante par mission, créée à la
  // première ouverture. `configured: false` tant que DAILY_API_KEY n'est
  // pas posée — le front l'affiche honnêtement. Le jeton nominatif identifie
  // le participant ; `owner` pour la RH/le superviseur.
  private async ouvrirSalleBrief(
    mission: { id: string; briefRoomName: string | null; briefRoomUrl: string | null },
    participant: { userId: string; userName: string; owner: boolean }
  ) {
    let roomName = mission.briefRoomName;
    let roomUrl = mission.briefRoomUrl;
    if (!roomName || !roomUrl) {
      const nouvelle = await this.daily.createRoom(
        `brief-${mission.id}`,
        Math.floor(Date.now() / 1000) + 365 * 86400
      );
      if (!nouvelle.configured || !nouvelle.roomName || !nouvelle.roomUrl) {
        return { configured: nouvelle.configured, url: null as string | null };
      }
      roomName = nouvelle.roomName;
      roomUrl = nouvelle.roomUrl;
      await this.prisma.mission.update({
        where: { id: mission.id },
        data: { briefRoomName: roomName, briefRoomUrl: roomUrl },
      });
    }
    const token = await this.daily.mintMeetingToken({
      roomName,
      userId: participant.userId,
      userName: participant.userName,
      isOwner: participant.owner,
    });
    return { configured: true, url: token ? `${roomUrl}?t=${token}` : roomUrl };
  }

  async salleBriefAgent(matricule: string) {
    const agent = await this.agentParMatricule(matricule);
    const mission = agent.missions.find((m) => m.dateFin === null);
    if (!mission) throw new BadRequestException("Aucune mission active : pas de salle de brief.");
    return this.ouvrirSalleBrief(mission, {
      userId: `agent-${agent.id}`,
      userName: `${agent.prenom} ${agent.nom}`,
      owner: false,
    });
  }

  // Côté RH/superviseur : ouvre la salle de la mission active de l'agent.
  async salleBriefRh(agentId: string) {
    const mission = await this.prisma.mission.findFirst({
      where: { agentId, dateFin: null },
    });
    if (!mission) throw new BadRequestException("Cet agent n'a pas de mission active.");
    return this.ouvrirSalleBrief(mission, {
      userId: "rh-superviseur",
      userName: "Superviseur / RH",
      owner: true,
    });
  }

  // Validation par la RH/le superviseur, avec une note facultative
  // (« Panne fibre validée », « Point prévu demain matin »...).
  async validerJournee(id: string, dto: ValiderJourneeDto) {
    const releve = await this.prisma.suiviAgentJournalier.findUnique({ where: { id } });
    if (!releve) throw new NotFoundException("Relevé introuvable.");
    return this.prisma.suiviAgentJournalier.update({
      where: { id },
      data: {
        statutValidation: "valide",
        valideLe: new Date(),
        commentaireSuperviseur: dto.commentaire?.trim() || null,
      },
    });
  }

  // Réouverture : rend la journée modifiable par l'agent (demande de
  // modification acceptée).
  async rouvrirJournee(id: string) {
    const releve = await this.prisma.suiviAgentJournalier.findUnique({ where: { id } });
    if (!releve) throw new NotFoundException("Relevé introuvable.");
    return this.prisma.suiviAgentJournalier.update({
      where: { id },
      data: { statutValidation: "a_valider", valideLe: null },
    });
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

  // ---- Mon casier (Espace Agent) -------------------------------------------

  // Le casier vu par l'agent : résultats de ses tests, retours du client,
  // contrat, historique de paie et somme perçue par mois. Les paiements
  // passent par getPaiements : même net que la RH et que « Mes paiements ».
  async getMonCasier(matricule: string) {
    const agent = await this.agentParMatricule(matricule);
    const missionsById = new Map(agent.missions.map((m) => [m.id, m]));

    const [attempts, notes, paiements] = await Promise.all([
      agent.candidatId
        ? this.prisma.evaluationAttempt.findMany({
            where: { candidatId: agent.candidatId },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve(null),
      this.prisma.noteClientAgent.findMany({
        where: { missionId: { in: [...missionsById.keys()] } },
        orderBy: { date: "desc" },
      }),
      this.getPaiements(matricule),
    ]);

    const parMois = new Map<string, { percu: number; enAttente: number }>();
    for (const l of paiements.lignes) {
      const m = parMois.get(l.periode) ?? { percu: 0, enAttente: 0 };
      if (l.statut === "paye") m.percu = round2(m.percu + l.netAPayer);
      else m.enAttente = round2(m.enAttente + l.netAPayer);
      parMois.set(l.periode, m);
    }

    return {
      matricule: agent.matricule,
      prenom: agent.prenom,
      nom: agent.nom,
      // null = aucun test rattaché à ce compte (distinct de « test sans résultat »).
      tests: attempts
        ? attempts.map((a) => ({
            id: a.id,
            parcours: a.parcours,
            status: a.status,
            passeLe: a.submittedAt ?? a.createdAt,
            corrigeLe: a.gradedAt,
            scores: {
              lexique: a.lexiqueScore,
              oral: a.oralScore,
              situations: a.situationsScore,
              video: a.videoScore,
              essai: a.essayScore,
            },
            totalScore: a.totalScore,
            niveau: a.tier,
          }))
        : null,
      notesClient: {
        moyenne: notes.length > 0 ? round2(notes.reduce((sum, n) => sum + n.note, 0) / notes.length) : null,
        liste: notes.map((n) => ({
          id: n.id,
          date: n.date,
          note: n.note,
          remarque: n.remarque,
          clientNom: missionsById.get(n.missionId)?.contrat.clientNom ?? "—",
          role: missionsById.get(n.missionId)?.role ?? "—",
        })),
      },
      contrat: {
        document: agent.documents.find((d) => d.type === "contrat") ?? null,
        statut: agent.statut,
        poste: agent.poste,
        dateEmbauche: agent.dateEmbauche,
        salaireBase: agent.salaireBase,
      },
      paiements: {
        lignes: paiements.lignes,
        parMois: Array.from(parMois.entries())
          .map(([periode, v]) => ({ periode, ...v }))
          .sort((a, b) => (a.periode < b.periode ? 1 : -1)),
        totalPercu: paiements.totalPaye,
        totalEnAttente: paiements.totalEnAttente,
      },
    };
  }

  // ---- Notes client & lien candidat (RH) -----------------------------------

  async ajouterNoteClient(missionId: string, dto: NoteClientDto) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException("Mission introuvable.");
    const date = new Date(dto.date);
    if (Number.isNaN(date.getTime())) throw new BadRequestException("Date invalide.");
    return this.prisma.noteClientAgent.create({
      data: { missionId, date, note: dto.note, remarque: dto.remarque?.trim() || null },
    });
  }

  async supprimerNoteClient(id: string) {
    const note = await this.prisma.noteClientAgent.findUnique({ where: { id } });
    if (!note) throw new NotFoundException("Note introuvable.");
    await this.prisma.noteClientAgent.delete({ where: { id } });
    return { ok: true };
  }

  // Rattache l'agent au candidat de même e-mail pour afficher ses résultats
  // de test. Refuse l'ambiguïté (plusieurs candidats) et un candidat déjà
  // rattaché à un autre agent : jamais de choix silencieux.
  async lierCandidat(agentId: string, email: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    const candidats = await this.prisma.candidat.findMany({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
      include: { agent: true },
    });
    if (candidats.length === 0) throw new NotFoundException("Aucun candidat avec cet e-mail.");
    if (candidats.length > 1) {
      throw new BadRequestException(
        "Plusieurs candidats portent cet e-mail : rattachement impossible automatiquement."
      );
    }
    const [candidat] = candidats;
    if (candidat.agent && candidat.agent.id !== agentId) {
      throw new BadRequestException("Ce candidat est déjà rattaché à un autre agent.");
    }
    await this.prisma.agent.update({ where: { id: agentId }, data: { candidatId: candidat.id } });
    return { candidatId: candidat.id, nom: `${candidat.firstName} ${candidat.lastName}` };
  }

  async delierCandidat(agentId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    await this.prisma.agent.update({ where: { id: agentId }, data: { candidatId: null } });
    return { ok: true };
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

    const [candidatLie, notesClient] = await Promise.all([
      agent.candidatId
        ? this.prisma.candidat.findUnique({ where: { id: agent.candidatId } })
        : Promise.resolve(null),
      this.prisma.noteClientAgent.findMany({
        where: { mission: { agentId: agent.id } },
        include: { mission: { include: { contrat: true } } },
        orderBy: { date: "desc" },
      }),
    ]);

    return {
      id: agent.id,
      ...dossier,
      candidatLie: candidatLie
        ? { nom: `${candidatLie.firstName} ${candidatLie.lastName}`, email: candidatLie.email }
        : null,
      notesClient: notesClient.map((n) => ({
        id: n.id,
        date: n.date,
        note: n.note,
        remarque: n.remarque,
        clientNom: n.mission.contrat.clientNom,
      })),
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
              heuresPanne: r.heuresPanne,
              remarques: r.remarques,
              statutValidation: r.statutValidation,
              commentaireSuperviseur: r.commentaireSuperviseur,
              alerte: niveauAlerte(r.tauxAtteint),
            })),
          }
        : null,
    };
  }
}
