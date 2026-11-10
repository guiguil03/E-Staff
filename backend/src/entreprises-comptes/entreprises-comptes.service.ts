import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import * as path from "path";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { StorageService } from "../common/storage.service";
import { DailyService } from "../classe-virtuelle/daily.service";
import { ouvrirSalleVisio } from "../common/salle-visio";
import { niveauAlerte } from "../common/suivi-agent";
import { ProductionService } from "../production/production.service";
import { TIER_LABELS } from "../evaluation/evaluation.service";
import {
  credentialsBox,
  ctaButton,
  emailParagraph,
  escapeHtml,
  renderEmailHtml,
} from "../common/email-template";
import { generateFacturePdf } from "./facture-pdf";
import { CreateEntrepriseDto } from "./dto/create-entreprise.dto";
import { RattacherContratDto } from "./dto/rattacher-contrat.dto";
import { ExprimerInteretDto } from "./dto/exprimer-interet.dto";
import { TraiterInteretDto } from "./dto/traiter-interet.dto";
import { AffecterLotDto } from "./dto/affecter-lot.dto";
import { PlanifierEntretienDto } from "./dto/planifier-entretien.dto";
import { EnvoyerMessageEntrepriseDto } from "./dto/envoyer-message-entreprise.dto";
import { UpsertEntrepriseLiveDto } from "./dto/upsert-entreprise-live.dto";
import { UpsertStandForumDto } from "./dto/upsert-stand-forum.dto";

const APP_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// Mêmes paliers de "vivier" que RhService (TIERS_VIVIER, non exporté) —
// dupliqué ici par convention du projet plutôt que partagé entre modules.
const TIERS_VIVIER = ["niveau_c1", "placement_direct"];

// Alphabet sans caractères ambigus — même génération que AgentsService/RhService.
const TEMP_PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generateTemporaryPassword(length = 10): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => TEMP_PASSWORD_CHARS[b % TEMP_PASSWORD_CHARS.length]).join("");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function moisDe(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Espace Entreprise (client B2B, 2026-11-03) — porte les deux faces, même
// découpage que AgentsService/SuperviseursService :
//   - côté RH (RhGuard) : création de compte, rattachement de contrats,
//     dépôt du contrat e-Staf, traitement des intérêts du vivier ;
//   - côté entreprise (EntrepriseGuard) : tableau de bord lecture, vivier de
//     talents anonymisé, salles d'entretien, formation, casier, messagerie,
//     live & stand.
@Injectable()
export class EntreprisesComptesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly storage: StorageService,
    private readonly daily: DailyService,
    private readonly production: ProductionService
  ) {}

  private async chargerEntreprise(matricule: string) {
    const entreprise = await this.prisma.entreprise.findUnique({ where: { matricule } });
    if (!entreprise) throw new NotFoundException("Entreprise introuvable.");
    return entreprise;
  }

  private async verifierContratAppartient(entrepriseId: string, contratId: string) {
    const contrat = await this.prisma.contratB2B.findFirst({ where: { id: contratId, entrepriseId } });
    if (!contrat) throw new ForbiddenException("Ce contrat ne vous appartient pas.");
    return contrat;
  }

  // ---- Compte & annuaire (RH) ----------------------------------------------

  private async prochainMatricule(): Promise<string> {
    const prefixe = `ETF-ENT-${new Date().getFullYear()}-`;
    const existants = await this.prisma.entreprise.findMany({
      where: { matricule: { startsWith: prefixe } },
      select: { matricule: true },
    });
    const max = existants.reduce((acc, e) => {
      const m = new RegExp(`^${prefixe}(\\d+)$`).exec(e.matricule);
      return m ? Math.max(acc, Number.parseInt(m[1], 10)) : acc;
    }, 0);
    return `${prefixe}${String(max + 1).padStart(4, "0")}`;
  }

  private async envoyerIdentifiants(
    entreprise: { contactNom: string; email: string; matricule: string },
    motDePasse: string,
    nouveau: boolean
  ) {
    const intro = nouveau
      ? "Un accès Espace Entreprise a été créé pour vous sur e-Staf."
      : "Voici vos nouveaux identifiants pour votre Espace Entreprise.";
    return this.email.send({
      to: entreprise.email,
      subject: nouveau
        ? "Bienvenue chez e-Staf — vos identifiants Espace Entreprise"
        : "Vos nouveaux identifiants e-Staf",
      text: `Bonjour ${entreprise.contactNom},\n\n${intro}\n\nMatricule : ${entreprise.matricule}\nMot de passe temporaire : ${motDePasse}\n\nNous vous conseillons de changer ce mot de passe dès votre première connexion.\n\nL'équipe e-Staf`,
      html: renderEmailHtml({
        title: nouveau ? "Bienvenue chez e-Staf" : "Vos nouveaux identifiants",
        preheader: "Vos identifiants pour votre Espace Entreprise",
        bodyHtml:
          emailParagraph(`Bonjour ${escapeHtml(entreprise.contactNom)},`) +
          emailParagraph(intro) +
          credentialsBox([
            { label: "Matricule", value: entreprise.matricule },
            { label: "Mot de passe temporaire", value: motDePasse },
          ]) +
          emailParagraph(
            "Vous y suivez vos équipes en temps réel, le vivier de talents, vos entretiens, votre contrat et vos factures. Changez ce mot de passe dès votre première connexion."
          ),
      }),
    });
  }

  async createEntreprise(dto: CreateEntrepriseDto) {
    const matricule = await this.prochainMatricule();
    const motDePasse = generateTemporaryPassword();
    const hash = await bcrypt.hash(motDePasse, 10);
    const entreprise = await this.prisma.entreprise.create({
      data: {
        matricule,
        raisonSociale: dto.raisonSociale,
        contactNom: dto.contactNom,
        email: dto.email,
        telephone: dto.telephone ?? null,
        compte: { create: { password: hash } },
      },
    });
    await this.envoyerIdentifiants(entreprise, motDePasse, true);
    return { id: entreprise.id, matricule: entreprise.matricule };
  }

  async regenererIdentifiants(id: string) {
    const entreprise = await this.prisma.entreprise.findUnique({ where: { id }, include: { compte: true } });
    if (!entreprise) throw new NotFoundException("Entreprise introuvable.");
    const motDePasse = generateTemporaryPassword();
    const hash = await bcrypt.hash(motDePasse, 10);
    if (entreprise.compte) {
      await this.prisma.compteEntreprise.update({
        where: { id: entreprise.compte.id },
        data: { password: hash, sessionsRevoqueesAt: new Date(), resetToken: null, resetTokenExpiresAt: null },
      });
    } else {
      await this.prisma.compteEntreprise.create({ data: { entrepriseId: entreprise.id, password: hash } });
    }
    await this.envoyerIdentifiants(entreprise, motDePasse, !entreprise.compte);
    return { ok: true };
  }

  async listEntreprises() {
    const entreprises = await this.prisma.entreprise.findMany({
      include: { compte: true, contrats: true },
      orderBy: { raisonSociale: "asc" },
    });
    return entreprises.map((e) => ({
      id: e.id,
      matricule: e.matricule,
      raisonSociale: e.raisonSociale,
      contactNom: e.contactNom,
      email: e.email,
      telephone: e.telephone,
      statut: e.statut,
      peutSeConnecter: !!e.compte,
      contrats: e.contrats.map((c) => ({ id: c.id, clientNom: c.clientNom, statut: c.statut })),
    }));
  }

  async rattacherContrat(id: string, dto: RattacherContratDto) {
    const entreprise = await this.prisma.entreprise.findUnique({ where: { id } });
    if (!entreprise) throw new NotFoundException("Entreprise introuvable.");
    const contrat = await this.prisma.contratB2B.findUnique({ where: { id: dto.contratId } });
    if (!contrat) throw new NotFoundException("Contrat introuvable.");
    return this.prisma.contratB2B.update({ where: { id: dto.contratId }, data: { entrepriseId: id } });
  }

  async detacherContrat(contratId: string) {
    const contrat = await this.prisma.contratB2B.findUnique({ where: { id: contratId } });
    if (!contrat) throw new NotFoundException("Contrat introuvable.");
    return this.prisma.contratB2B.update({ where: { id: contratId }, data: { entrepriseId: null } });
  }

  async uploadContrat(id: string, file: Express.Multer.File) {
    const entreprise = await this.prisma.entreprise.findUnique({ where: { id } });
    if (!entreprise) throw new NotFoundException("Entreprise introuvable.");
    const extension = path.extname(file.originalname) || "";
    const key = `entreprises/${entreprise.id}/contrat/${Date.now()}${extension}`;
    await this.storage.uploadBuffer(key, file.buffer, file.mimetype || "application/pdf");
    return this.prisma.entrepriseDocument.create({
      data: {
        entrepriseId: entreprise.id,
        type: "contrat",
        filename: file.originalname,
        storageKey: key,
        uploadedBy: "rh",
      },
    });
  }

  // ---- Vivier de talents (RH : traitement des intérêts) --------------------

  async listInterets(entrepriseId?: string) {
    return this.prisma.interetVivier.findMany({
      where: entrepriseId ? { entrepriseId } : undefined,
      include: { entreprise: true, agent: true, apprenant: true, contrat: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async traiterInteret(interetId: string, dto: TraiterInteretDto) {
    const interet = await this.prisma.interetVivier.findUnique({ where: { id: interetId } });
    if (!interet) throw new NotFoundException("Intérêt introuvable.");

    if (dto.statut === "affecte") {
      if (!dto.contratId || !dto.role || !dto.dateDebut) {
        throw new BadRequestException("contratId, role et dateDebut sont requis pour affecter ce profil.");
      }
      await this.production.createMission({
        agentId: interet.agentId ?? undefined,
        apprenantId: interet.apprenantId ?? undefined,
        contratId: dto.contratId,
        superviseurId: dto.superviseurId,
        role: dto.role,
        dateDebut: dto.dateDebut,
        tarifNegocie: dto.tarifNegocie,
        objectifJournalier: dto.objectifJournalier,
        objectifHebdo: dto.objectifHebdo,
      });
    }

    return this.prisma.interetVivier.update({ where: { id: interetId }, data: { statut: dto.statut } });
  }

  // Affectation en lot : une Mission par profil coché, avec les mêmes
  // contrat / superviseur / rôle / date. Chaque profil est traité
  // indépendamment : un échec (déjà en mission, déjà affecté, contrat d'une
  // autre entreprise…) n'annule pas les autres et est rapporté ligne par ligne.
  async affecterLot(dto: AffecterLotDto) {
    const contrat = await this.prisma.contratB2B.findUnique({ where: { id: dto.contratId } });
    if (!contrat) throw new NotFoundException("Contrat introuvable.");

    const resultats: { interetId: string; ok: boolean; erreur?: string }[] = [];
    for (const interetId of [...new Set(dto.interetIds)]) {
      try {
        const interet = await this.prisma.interetVivier.findUnique({ where: { id: interetId } });
        if (!interet) throw new NotFoundException("Intérêt introuvable.");
        if (interet.statut === "affecte") throw new BadRequestException("Déjà affecté.");
        if (contrat.entrepriseId && contrat.entrepriseId !== interet.entrepriseId) {
          throw new BadRequestException("Ce contrat appartient à une autre entreprise que la demande.");
        }
        await this.traiterInteret(interetId, {
          statut: "affecte",
          contratId: dto.contratId,
          superviseurId: dto.superviseurId,
          role: dto.role,
          dateDebut: dto.dateDebut,
          tarifNegocie: dto.tarifNegocie,
          objectifJournalier: dto.objectifJournalier,
          objectifHebdo: dto.objectifHebdo,
        });
        resultats.push({ interetId, ok: true });
      } catch (e) {
        resultats.push({ interetId, ok: false, erreur: e instanceof Error ? e.message : "Échec de l'affectation." });
      }
    }
    return { affectes: resultats.filter((r) => r.ok).length, echecs: resultats.filter((r) => !r.ok).length, resultats };
  }

  // ---- Tableau de bord (lecture, vision globale + par contrat) -------------

  async getDashboard(matricule: string, contratId?: string) {
    const entreprise = await this.chargerEntreprise(matricule);

    const debut = new Date();
    debut.setUTCHours(0, 0, 0, 0);
    debut.setUTCDate(1);
    debut.setUTCDate(debut.getUTCDate() - 7);

    const contrats = await this.prisma.contratB2B.findMany({
      where: { entrepriseId: entreprise.id },
      include: {
        missions: {
          where: { dateFin: null, agentId: { not: null } },
          include: {
            agent: true,
            superviseur: true,
            suivisJournaliers: { where: { jour: { gte: debut } }, orderBy: { jour: "asc" } },
          },
        },
      },
    });

    const toutesMissions = contrats.flatMap((c) => c.missions.map((m) => ({ ...m, contrat: c })));
    const missions = contratId ? toutesMissions.filter((m) => m.contratId === contratId) : toutesMissions;
    const periode = moisDe(new Date());

    const equipe = missions.map((m) => {
      const duMois = m.suivisJournaliers.filter((r) => moisDe(r.jour) === periode);
      const tauxMoyen =
        duMois.length > 0 ? round2(duMois.reduce((s, r) => s + r.tauxAtteint, 0) / duMois.length) : null;
      return {
        id: m.agent!.id,
        matricule: m.agent!.matricule,
        nom: `${m.agent!.prenom} ${m.agent!.nom}`,
        role: m.role,
        contratId: m.contratId,
        clientNom: m.contrat.clientNom,
        statutPresence: m.agent!.statutPresence,
        statutPresenceDepuis: m.agent!.statutPresenceDepuis,
        tauxMoyenMois: tauxMoyen,
        alerte: tauxMoyen === null ? null : niveauAlerte(tauxMoyen),
        superviseurNom: m.superviseur ? `${m.superviseur.prenom} ${m.superviseur.nom}` : null,
      };
    });

    const statuts: Record<string, number> = {
      en_ligne: 0,
      en_pause: 0,
      en_formation: 0,
      en_panne: 0,
      hors_ligne: 0,
    };
    for (const l of equipe) statuts[l.statutPresence] = (statuts[l.statutPresence] ?? 0) + 1;

    const tousTaux = missions.flatMap((m) =>
      m.suivisJournaliers.filter((r) => moisDe(r.jour) === periode).map((r) => r.tauxAtteint)
    );
    const tauxGlobal = tousTaux.length > 0 ? round2(tousTaux.reduce((a, b) => a + b, 0) / tousTaux.length) : null;

    // Courbe de la semaine (lundi -> dimanche), même principe que le
    // dashboard Superviseur.
    const lundi = new Date(debut);
    lundi.setUTCDate(lundi.getUTCDate() + 7);
    const indexJour = (d: Date) => Math.round((d.getTime() - lundi.getTime()) / 86400000);
    const courbe = Array.from({ length: 7 }, (_, i) => {
      const duJour = missions.flatMap((m) => m.suivisJournaliers.filter((r) => indexJour(r.jour) === i));
      return duJour.length > 0 ? round2(duJour.reduce((s, r) => s + r.tauxAtteint, 0) / duJour.length) : null;
    });

    const clients = contrats.map((c) => ({ id: c.id, clientNom: c.clientNom, statut: c.statut }));

    return {
      entreprise: { matricule: entreprise.matricule, raisonSociale: entreprise.raisonSociale },
      contratId: contratId ?? null,
      periode,
      kpis: {
        agentsTotal: equipe.length,
        tauxGlobal,
        agentsOrange: equipe.filter((l) => l.alerte === "orange").length,
        agentsRouge: equipe.filter((l) => l.alerte === "rouge").length,
      },
      courbeSemaine: courbe,
      statuts,
      equipe,
      clients,
    };
  }

  // ---- Vivier de talents (entreprise : lecture anonymisée) -----------------

  private profilAnonyme(
    type: "agent" | "apprenant",
    id: string,
    data: { poste: string | null; tier: string | null; totalScore: number | null; experienceAnnees: number | null }
  ) {
    const hash = crypto.createHash("sha256").update(id).digest("hex").slice(0, 6).toUpperCase();
    return {
      ref: `${type}:${id}`,
      label: `Profil ${type === "agent" ? "AG" : "AP"}-${hash}`,
      type,
      poste: data.poste,
      niveau: data.tier ? TIER_LABELS[data.tier] ?? data.tier : null,
      totalScore: data.totalScore,
      experienceAnnees: data.experienceAnnees,
      disponible: true,
    };
  }

  async listerVivier(matricule: string) {
    await this.chargerEntreprise(matricule);
    return this.profilsVivier();
  }

  private async profilsVivier() {
    const [agents, apprenants] = await Promise.all([
      this.prisma.agent.findMany({
        where: { statut: "actif", missions: { none: { dateFin: null } } },
        include: { candidat: { include: { attempts: { orderBy: { createdAt: "desc" }, take: 1 } } } },
      }),
      this.prisma.apprenant.findMany({
        where: { statutAgent: { in: ["actif", "formation"] }, missions: { none: { dateFin: null } } },
        include: { evaluationAttempt: true },
      }),
    ]);

    const vivierAgents = agents.map((a) => {
      const attempt = a.candidat?.attempts[0] ?? null;
      return this.profilAnonyme("agent", a.id, {
        poste: a.poste,
        tier: attempt?.tier ?? null,
        totalScore: attempt?.totalScore ?? null,
        experienceAnnees: a.candidat?.experienceAnnees ?? null,
      });
    });

    const vivierApprenants = apprenants
      .filter((ap) => ap.evaluationAttempt && TIERS_VIVIER.includes(ap.evaluationAttempt.tier ?? ""))
      .map((ap) =>
        this.profilAnonyme("apprenant", ap.id, {
          poste: null,
          tier: ap.evaluationAttempt!.tier,
          totalScore: ap.evaluationAttempt!.totalScore,
          experienceAnnees: null,
        })
      );

    return [...vivierAgents, ...vivierApprenants];
  }

  async exprimerInteret(matricule: string, dto: ExprimerInteretDto) {
    const entreprise = await this.chargerEntreprise(matricule);
    const [type, id] = dto.ref.split(":");
    if (type !== dto.type || !id) throw new BadRequestException("Référence de profil invalide.");

    if (type === "agent") {
      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent || agent.statut !== "actif") throw new NotFoundException("Profil introuvable ou plus disponible.");
    } else {
      const apprenant = await this.prisma.apprenant.findUnique({ where: { id } });
      if (!apprenant) throw new NotFoundException("Profil introuvable ou plus disponible.");
    }
    if (dto.contratId) await this.verifierContratAppartient(entreprise.id, dto.contratId);

    return this.prisma.interetVivier.create({
      data: {
        entrepriseId: entreprise.id,
        contratId: dto.contratId ?? null,
        agentId: type === "agent" ? id : null,
        apprenantId: type === "apprenant" ? id : null,
        posteSouhaite: dto.posteSouhaite ?? null,
        message: dto.message ?? null,
      },
      select: { id: true, statut: true, createdAt: true, posteSouhaite: true },
    });
  }

  async listMesInterets(matricule: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const interets = await this.prisma.interetVivier.findMany({
      where: { entrepriseId: entreprise.id },
      include: { agent: true, apprenant: true, contrat: true },
      orderBy: { createdAt: "desc" },
    });
    return interets.map((i) => ({
      id: i.id,
      statut: i.statut,
      posteSouhaite: i.posteSouhaite,
      message: i.message,
      createdAt: i.createdAt,
      clientNom: i.contrat?.clientNom ?? null,
      // Identité révélée uniquement une fois l'affectation validée par la RH
      // (voir TraiterInteretDto) — jamais avant.
      profil:
        i.statut === "affecte"
          ? i.agent
            ? { nom: `${i.agent.prenom} ${i.agent.nom}`, matricule: i.agent.matricule }
            : i.apprenant
              ? { nom: `${i.apprenant.prenom} ${i.apprenant.nom}`, matricule: i.apprenant.matricule }
              : null
          : null,
    }));
  }

  async getBilanPrisePoste(matricule: string, interetId: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const interet = await this.prisma.interetVivier.findFirst({
      where: { id: interetId, entrepriseId: entreprise.id },
      include: {
        agent: { include: { candidat: { include: { attempts: { orderBy: { createdAt: "desc" }, take: 1 } } } } },
        apprenant: { include: { evaluationAttempt: true } },
      },
    });
    if (!interet) throw new NotFoundException("Intérêt introuvable.");
    if (interet.statut !== "affecte") {
      throw new ForbiddenException("Le bilan n'est disponible qu'une fois l'affectation validée par la RH.");
    }

    const attempt = interet.agent?.candidat?.attempts[0] ?? interet.apprenant?.evaluationAttempt ?? null;
    const videoKey = interet.agent?.candidat?.videoPresentationKey ?? null;
    const nom = interet.agent
      ? `${interet.agent.prenom} ${interet.agent.nom}`
      : interet.apprenant
        ? `${interet.apprenant.prenom} ${interet.apprenant.nom}`
        : null;

    return {
      nom,
      tier: attempt?.tier ?? null,
      tierLabel: attempt?.tier ? TIER_LABELS[attempt.tier] ?? attempt.tier : null,
      totalScore: attempt?.totalScore ?? null,
      scores: attempt
        ? {
            lexique: attempt.lexiqueScore,
            oral: attempt.oralScore,
            situations: attempt.situationsScore,
            video: attempt.videoScore,
            essay: attempt.essayScore,
          }
        : null,
      experienceAnnees: interet.agent?.candidat?.experienceAnnees ?? null,
      experienceSecteurs: interet.agent?.candidat?.experienceSecteurs ?? null,
      posteVise: interet.agent?.candidat?.posteVise ?? null,
      videoDisponible: !!videoKey,
    };
  }

  async getBilanVideoStream(matricule: string, interetId: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const interet = await this.prisma.interetVivier.findFirst({
      where: { id: interetId, entrepriseId: entreprise.id, statut: "affecte" },
      include: { agent: { include: { candidat: true } } },
    });
    const key = interet?.agent?.candidat?.videoPresentationKey;
    if (!interet || !key) throw new NotFoundException("Vidéo indisponible.");
    return this.storage.getObjectStream(key);
  }

  // ---- Vivier : médias du candidat (CV, vidéo, audios) -----------------------
  // Consultables AVANT de sélectionner un profil pour un entretien. Le profil
  // doit appartenir au vivier présenté à l'entreprise (mêmes critères que
  // listerVivier) ; chaque flux est servi uniquement par ces routes, jamais par
  // une URL de stockage.

  private async mediasDuProfil(matricule: string, type: string, id: string) {
    await this.chargerEntreprise(matricule);
    if (type !== "agent" && type !== "apprenant") throw new BadRequestException("Type de profil invalide.");
    const vivier = await this.profilsVivier();
    if (!vivier.some((p) => p.ref === `${type}:${id}`)) {
      throw new NotFoundException("Profil introuvable ou plus disponible.");
    }

    if (type === "agent") {
      const agent = await this.prisma.agent.findUnique({
        where: { id },
        include: { candidat: { include: { attempts: { orderBy: { createdAt: "desc" }, take: 1 } } } },
      });
      return { candidat: agent?.candidat ?? null, attemptId: agent?.candidat?.attempts[0]?.id ?? null };
    }
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { id },
      include: { evaluationAttempt: { include: { candidat: true } } },
    });
    return {
      candidat: apprenant?.evaluationAttempt?.candidat ?? null,
      attemptId: apprenant?.evaluationAttempt?.id ?? null,
    };
  }

  async listMediasVivier(matricule: string, type: string, id: string) {
    const { candidat, attemptId } = await this.mediasDuProfil(matricule, type, id);
    const audios = attemptId
      ? await this.prisma.situationResponse.findMany({
          where: { attemptId },
          select: { id: true, situationIndex: true },
          orderBy: { situationIndex: "asc" },
        })
      : [];
    return {
      cvDisponible: !!candidat?.cvKey,
      videoDisponible: !!candidat?.videoPresentationKey,
      audios: audios.map((a) => ({ id: a.id, situationIndex: a.situationIndex })),
    };
  }

  async getCvVivierStream(matricule: string, type: string, id: string) {
    const { candidat } = await this.mediasDuProfil(matricule, type, id);
    if (!candidat?.cvKey) throw new NotFoundException("CV indisponible.");
    return this.storage.getObjectStream(candidat.cvKey).catch(() => {
      throw new NotFoundException("CV indisponible.");
    });
  }

  async getVideoVivierStream(matricule: string, type: string, id: string) {
    const { candidat } = await this.mediasDuProfil(matricule, type, id);
    if (!candidat?.videoPresentationKey) throw new NotFoundException("Vidéo indisponible.");
    return this.storage.getObjectStream(candidat.videoPresentationKey).catch(() => {
      throw new NotFoundException("Vidéo indisponible.");
    });
  }

  async getAudioVivierStream(matricule: string, type: string, id: string, reponseId: string) {
    const { attemptId } = await this.mediasDuProfil(matricule, type, id);
    // L'audio doit appartenir à la tentative DE CE profil — sinon n'importe
    // quel identifiant de réponse serait lisible via un profil du vivier.
    const reponse = attemptId
      ? await this.prisma.situationResponse.findFirst({ where: { id: reponseId, attemptId } })
      : null;
    if (!reponse) throw new NotFoundException("Audio indisponible.");
    return this.storage.getObjectStream(reponse.audioUrl).catch(() => {
      throw new NotFoundException("Audio indisponible.");
    });
  }

  // ---- Salle d'entretien virtuel ---------------------------------------------

  async listEntretiens(matricule: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const entretiens = await this.prisma.entretienVirtuel.findMany({
      where: { entrepriseId: entreprise.id },
      include: { interetVivier: true },
      orderBy: { createdAt: "desc" },
    });
    // L'URL brute de la salle n'est jamais exposée : l'entreprise passe par
    // /rejoindre, qui émet un jeton nominatif. Le profil reste anonymisé.
    return entretiens.map((e) => {
      const iv = e.interetVivier;
      const ref = iv?.agentId ? `agent:${iv.agentId}` : iv?.apprenantId ? `apprenant:${iv.apprenantId}` : null;
      return {
        id: e.id,
        titre: e.titre,
        startAt: e.startAt,
        dureeMinutes: e.dureeMinutes,
        createdAt: e.createdAt,
        salleDisponible: !!(e.dailyRoomName && e.dailyRoomUrl),
        profilLabel: ref ? this.labelProfil(ref) : null,
      };
    });
  }

  private labelProfil(ref: string): string {
    const [type, id] = ref.split(":");
    const hash = crypto.createHash("sha256").update(id).digest("hex").slice(0, 6).toUpperCase();
    return `Profil ${type === "agent" ? "AG" : "AP"}-${hash}`;
  }

  // Lien d'accès nominatif à la salle d'un entretien — entreprise (propriétaire
  // de l'entretien) ou RH e-Staf (supervision). Le candidat, lui, reçoit son
  // lien par e-mail à la planification.
  private async lienSalle(
    entretien: { id: string; dailyRoomName: string | null; dailyRoomUrl: string | null },
    participant: { userId: string; userName: string }
  ) {
    if (!entretien.dailyRoomName || !entretien.dailyRoomUrl) {
      throw new BadRequestException("La salle de cet entretien n'est pas disponible.");
    }
    return ouvrirSalleVisio(
      this.daily,
      {
        roomId: `entretien-${entretien.id}`,
        roomName: entretien.dailyRoomName,
        roomUrl: entretien.dailyRoomUrl,
        dureeValiditeSecondes: 7 * 86400,
        persister: async () => undefined,
      },
      { ...participant, owner: true }
    );
  }

  async rejoindreEntretien(matricule: string, entretienId: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const entretien = await this.prisma.entretienVirtuel.findFirst({
      where: { id: entretienId, entrepriseId: entreprise.id },
    });
    if (!entretien) throw new NotFoundException("Entretien introuvable.");
    return this.lienSalle(entretien, { userId: `entreprise-${entreprise.id}`, userName: entreprise.raisonSociale });
  }

  // ---- RH : vue d'ensemble des entretiens --------------------------------------

  async listEntretiensRh() {
    const entretiens = await this.prisma.entretienVirtuel.findMany({
      include: { entreprise: true, interetVivier: { include: { agent: true, apprenant: true } } },
      orderBy: [{ startAt: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
    return entretiens.map((e) => {
      const personne = e.interetVivier?.agent ?? e.interetVivier?.apprenant ?? null;
      return {
        id: e.id,
        titre: e.titre,
        startAt: e.startAt,
        dureeMinutes: e.dureeMinutes,
        createdAt: e.createdAt,
        entreprise: e.entreprise.raisonSociale,
        candidat: personne ? `${personne.prenom} ${personne.nom}` : "Candidat hors vivier",
        salleDisponible: !!(e.dailyRoomName && e.dailyRoomUrl),
      };
    });
  }

  async rejoindreEntretienRh(entretienId: string) {
    const entretien = await this.prisma.entretienVirtuel.findUnique({ where: { id: entretienId } });
    if (!entretien) throw new NotFoundException("Entretien introuvable.");
    return this.lienSalle(entretien, { userId: "rh-estaf", userName: "RH e-Staf" });
  }

  // Le profil doit appartenir au vivier présenté à l'entreprise (mêmes
  // critères que listerVivier) ; un intérêt existant est réutilisé pour ne
  // pas dupliquer les demandes côté RH.
  private async interetPourProfil(entrepriseId: string, profilRef: string): Promise<string> {
    const [type, id] = profilRef.split(":");
    if ((type !== "agent" && type !== "apprenant") || !id) {
      throw new BadRequestException("Référence de profil invalide.");
    }
    const vivier = await this.profilsVivier();
    if (!vivier.some((p) => p.ref === profilRef)) throw new NotFoundException("Profil introuvable ou plus disponible.");

    const existant = await this.prisma.interetVivier.findFirst({
      where: { entrepriseId, ...(type === "agent" ? { agentId: id } : { apprenantId: id }) },
      orderBy: { createdAt: "desc" },
    });
    if (existant) return existant.id;
    const cree = await this.prisma.interetVivier.create({
      data: {
        entrepriseId,
        agentId: type === "agent" ? id : null,
        apprenantId: type === "apprenant" ? id : null,
        message: "Entretien demandé depuis la salle d'entretien.",
      },
    });
    return cree.id;
  }

  async planifierEntretien(matricule: string, dto: PlanifierEntretienDto) {
    const entreprise = await this.chargerEntreprise(matricule);

    // Profil choisi directement dans le vivier : intérêt créé/réutilisé.
    if (dto.profilRef && !dto.interetVivierId) {
      dto = { ...dto, interetVivierId: await this.interetPourProfil(entreprise.id, dto.profilRef) };
    }

    let emailDestinataire = dto.emailCandidat ?? null;
    let nomDestinataire = "Candidat";
    if (dto.interetVivierId) {
      const interet = await this.prisma.interetVivier.findFirst({
        where: { id: dto.interetVivierId, entrepriseId: entreprise.id },
        include: { agent: true, apprenant: true },
      });
      if (!interet) throw new NotFoundException("Intérêt introuvable.");
      const personne = interet.agent ?? interet.apprenant;
      if (personne) {
        emailDestinataire = personne.email;
        nomDestinataire = personne.prenom;
      }
    }
    if (!emailDestinataire) {
      throw new BadRequestException("E-mail du candidat requis pour un entretien hors vivier.");
    }

    const entretien = await this.prisma.entretienVirtuel.create({
      data: {
        entrepriseId: entreprise.id,
        interetVivierId: dto.interetVivierId ?? null,
        titre: dto.titre,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        dureeMinutes: dto.dureeMinutes ?? 30,
      },
    });

    const salle = await ouvrirSalleVisio(
      this.daily,
      {
        roomId: `entretien-${entretien.id}`,
        roomName: null,
        roomUrl: null,
        dureeValiditeSecondes: 7 * 86400,
        persister: (roomName, roomUrl) =>
          this.prisma.entretienVirtuel.update({
            where: { id: entretien.id },
            data: { dailyRoomName: roomName, dailyRoomUrl: roomUrl },
          }),
      },
      { userId: `entreprise-${entreprise.id}`, userName: entreprise.raisonSociale, owner: true }
    );

    let emailEnvoye = false;
    if (salle.configured) {
      const updated = await this.prisma.entretienVirtuel.findUnique({ where: { id: entretien.id } });
      if (updated?.dailyRoomName && updated.dailyRoomUrl) {
        const token = await this.daily.mintMeetingToken({
          roomName: updated.dailyRoomName,
          userId: `candidat-${entretien.id}`,
          userName: nomDestinataire,
          isOwner: false,
        });
        const lienCandidat = token ? `${updated.dailyRoomUrl}?t=${token}` : updated.dailyRoomUrl;
        await this.email.send({
          to: emailDestinataire,
          subject: `Invitation à un entretien — ${entreprise.raisonSociale}`,
          text: `Bonjour ${nomDestinataire},\n\n${entreprise.raisonSociale} vous invite à un entretien virtuel : ${dto.titre}.\n${dto.startAt ? `Date : ${new Date(dto.startAt).toLocaleString("fr-FR")}\n` : ""}\nRejoignez l'entretien ici :\n${lienCandidat}\n\nL'équipe e-Staf`,
          html: renderEmailHtml({
            title: "Invitation à un entretien",
            preheader: `${entreprise.raisonSociale} vous invite à un entretien virtuel`,
            bodyHtml:
              emailParagraph(`Bonjour ${escapeHtml(nomDestinataire)},`) +
              emailParagraph(
                `<strong>${escapeHtml(entreprise.raisonSociale)}</strong> vous invite à un entretien virtuel : <strong>${escapeHtml(dto.titre)}</strong>.`
              ) +
              (dto.startAt
                ? emailParagraph(`Date : ${escapeHtml(new Date(dto.startAt).toLocaleString("fr-FR"))}`)
                : "") +
              ctaButton("Rejoindre l'entretien", lienCandidat),
          }),
        });
        emailEnvoye = true;
      }
    }

    return { id: entretien.id, configured: salle.configured, urlEntreprise: salle.url, emailEnvoye };
  }

  // ---- Formation : supports déposés par l'entreprise ------------------------

  async uploadSupportFormation(matricule: string, contratId: string | null, file: Express.Multer.File) {
    const entreprise = await this.chargerEntreprise(matricule);
    if (contratId) await this.verifierContratAppartient(entreprise.id, contratId);

    const extension = path.extname(file.originalname) || "";
    const key = `supports-formation-entreprise/${entreprise.id}/${Date.now()}${extension}`;
    await this.storage.uploadFile(key, file.path, file.mimetype || "application/octet-stream");

    const support = await this.prisma.supportFormationEntreprise.create({
      data: {
        entrepriseId: entreprise.id,
        contratId,
        filename: file.originalname,
        storageKey: key,
        mimeType: file.mimetype || "application/octet-stream",
      },
    });

    const missions = await this.prisma.mission.findMany({
      where: {
        dateFin: null,
        agentId: { not: null },
        contrat: contratId ? { id: contratId } : { entrepriseId: entreprise.id },
      },
      include: { agent: true },
    });
    const link = `${APP_URL}/compte/agent/mon-dossier`;
    // Pas d'await (même convention que SupportCoursService.uploadSupport) :
    // l'upload ne doit pas attendre l'envoi de potentiellement nombreux e-mails.
    void Promise.all(
      missions
        .filter((m) => m.agent)
        .map((m) =>
          this.email.send({
            to: m.agent!.email,
            subject: `Nouveau support de formation — ${entreprise.raisonSociale}`,
            text: `Bonjour ${m.agent!.prenom},\n\n${entreprise.raisonSociale} vient de déposer un nouveau support de formation : ${file.originalname}.\n\nRetrouvez-le ici :\n${link}\n\nL'équipe e-Staf`,
            html: renderEmailHtml({
              title: "Nouveau support de formation",
              preheader: `${entreprise.raisonSociale} — ${file.originalname}`,
              bodyHtml:
                emailParagraph(`Bonjour ${escapeHtml(m.agent!.prenom)},`) +
                emailParagraph(
                  `<strong>${escapeHtml(entreprise.raisonSociale)}</strong> vient de déposer un nouveau support de formation : <strong>${escapeHtml(file.originalname)}</strong>.`
                ) +
                ctaButton("Voir mon dossier", link),
            }),
          })
        )
    );

    return support;
  }

  async listSupportsFormation(matricule: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const supports = await this.prisma.supportFormationEntreprise.findMany({
      where: { entrepriseId: entreprise.id },
      orderBy: { createdAt: "desc" },
    });
    return supports.map(({ storageKey: _storageKey, ...rest }) => rest);
  }

  async getSupportFormationStream(matricule: string, id: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const support = await this.prisma.supportFormationEntreprise.findUnique({ where: { id } });
    if (!support || support.entrepriseId !== entreprise.id) throw new NotFoundException("Support introuvable.");
    const { stream, contentType } = await this.storage.getObjectStream(support.storageKey);
    return { stream, contentType: contentType ?? support.mimeType, filename: support.filename };
  }

  // Côté agent — supports déposés par l'entreprise cliente pour SA mission
  // active (voir AgentsController).
  async listSupportsFormationPourAgent(agentMatricule: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { matricule: agentMatricule },
      include: { missions: { where: { dateFin: null }, include: { contrat: true }, take: 1 } },
    });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    const contratId = agent.missions[0]?.contratId ?? null;
    if (!contratId) return [];
    const supports = await this.prisma.supportFormationEntreprise.findMany({
      where: { OR: [{ contratId }, { contratId: null, entreprise: { contrats: { some: { id: contratId } } } }] },
      orderBy: { createdAt: "desc" },
    });
    return supports.map(({ storageKey: _storageKey, ...rest }) => rest);
  }

  async getSupportFormationStreamPourAgent(agentMatricule: string, id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { matricule: agentMatricule },
      include: { missions: { where: { dateFin: null }, take: 1 } },
    });
    if (!agent) throw new NotFoundException("Agent introuvable.");
    const contratId = agent.missions[0]?.contratId ?? null;
    const support = await this.prisma.supportFormationEntreprise.findUnique({ where: { id } });
    if (!support || !contratId || (support.contratId && support.contratId !== contratId)) {
      throw new NotFoundException("Support introuvable.");
    }
    const { stream, contentType } = await this.storage.getObjectStream(support.storageKey);
    return { stream, contentType: contentType ?? support.mimeType, filename: support.filename };
  }

  // ---- Casier (contrat + factures) -------------------------------------------

  async getMonCasier(matricule: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const [documents, contrats] = await Promise.all([
      this.prisma.entrepriseDocument.findMany({ where: { entrepriseId: entreprise.id }, orderBy: { createdAt: "desc" } }),
      this.prisma.contratB2B.findMany({
        where: { entrepriseId: entreprise.id },
        include: { factures: { orderBy: { dateEmission: "desc" } } },
      }),
    ]);
    const factures = contrats.flatMap((c) => c.factures.map((f) => ({ ...f, clientNom: c.clientNom })));
    return {
      entreprise: {
        matricule: entreprise.matricule,
        raisonSociale: entreprise.raisonSociale,
        contactNom: entreprise.contactNom,
        email: entreprise.email,
        telephone: entreprise.telephone,
      },
      documents: documents.map(({ storageKey: _storageKey, ...rest }) => rest),
      factures,
    };
  }

  async getDocumentStream(matricule: string, documentId: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const doc = await this.prisma.entrepriseDocument.findUnique({ where: { id: documentId } });
    if (!doc || doc.entrepriseId !== entreprise.id) throw new NotFoundException("Document introuvable.");
    const { stream, contentType } = await this.storage.getObjectStream(doc.storageKey);
    return { stream, contentType: contentType ?? "application/octet-stream", filename: doc.filename };
  }

  async getFacturePdf(matricule: string, factureId: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const facture = await this.prisma.facture.findUnique({ where: { id: factureId }, include: { contrat: true } });
    if (!facture || facture.contrat.entrepriseId !== entreprise.id) throw new NotFoundException("Facture introuvable.");
    return generateFacturePdf({
      raisonSociale: entreprise.raisonSociale,
      clientNom: facture.contrat.clientNom,
      periode: facture.periode,
      montant: facture.montant,
      statut: facture.statut,
      dateEmission: facture.dateEmission,
      datePaiement: facture.datePaiement,
    });
  }

  // ---- Échange avec le Superviseur -------------------------------------------

  async listMessages(matricule: string, contratId?: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    return this.prisma.messageEntreprise.findMany({
      where: { entrepriseId: entreprise.id, ...(contratId ? { contratId } : {}) },
      orderBy: { createdAt: "asc" },
    });
  }

  async envoyerMessage(matricule: string, dto: EnvoyerMessageEntrepriseDto) {
    const entreprise = await this.chargerEntreprise(matricule);
    if (dto.contratId) await this.verifierContratAppartient(entreprise.id, dto.contratId);
    return this.prisma.messageEntreprise.create({
      data: { entrepriseId: entreprise.id, contratId: dto.contratId ?? null, auteur: "entreprise", texte: dto.texte },
    });
  }

  async listBilansSuperviseur(matricule: string, contratId?: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const contrats = await this.prisma.contratB2B.findMany({
      where: { entrepriseId: entreprise.id, ...(contratId ? { id: contratId } : {}) },
      select: { id: true, clientNom: true },
    });
    const contratIds = contrats.map((c) => c.id);
    const rapports = await this.prisma.rapportHebdoSuperviseur.findMany({
      where: { contratId: { in: contratIds } },
      include: { superviseur: true },
      orderBy: { semaine: "desc" },
    });
    return rapports.map((r) => ({
      id: r.id,
      contratId: r.contratId,
      clientNom: contrats.find((c) => c.id === r.contratId)?.clientNom ?? null,
      semaine: r.semaine,
      constat: r.constat,
      analyse: r.analyse,
      axesAmelioration: r.axesAmelioration,
      superviseurNom: r.superviseur ? `${r.superviseur.prenom} ${r.superviseur.nom}` : null,
      createdAt: r.createdAt,
    }));
  }

  // Côté superviseur — voir SuperviseursController. Vérifie que ce contrat
  // est bien encadré par ce superviseur avant de laisser lire/répondre.
  async verifierContratEncadreParSuperviseur(superviseurId: string, contratId: string) {
    const mission = await this.prisma.mission.findFirst({ where: { contratId, superviseurId } });
    if (!mission) throw new ForbiddenException("Vous n'encadrez pas ce contrat.");
  }

  // ---- Live dans la communauté ------------------------------------------------

  async listLives(matricule: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    return this.prisma.entrepriseLive.findMany({ where: { entrepriseId: entreprise.id }, orderBy: { createdAt: "desc" } });
  }

  async creerLive(matricule: string, dto: UpsertEntrepriseLiveDto) {
    const entreprise = await this.chargerEntreprise(matricule);
    return this.prisma.entrepriseLive.create({
      data: {
        entrepriseId: entreprise.id,
        titre: dto.titre,
        description: dto.description ?? null,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        dureeMinutes: dto.dureeMinutes ?? 60,
      },
    });
  }

  async annulerLive(matricule: string, id: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const live = await this.prisma.entrepriseLive.findFirst({ where: { id, entrepriseId: entreprise.id } });
    if (!live) throw new NotFoundException("Live introuvable.");
    if (live.dailyRoomName) await this.daily.deleteRoom(live.dailyRoomName);
    return this.prisma.entrepriseLive.update({ where: { id }, data: { statut: "annule" } });
  }

  async salleLive(matricule: string, id: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    const live = await this.prisma.entrepriseLive.findFirst({ where: { id, entrepriseId: entreprise.id } });
    if (!live) throw new NotFoundException("Live introuvable.");

    let { dailyRoomName: roomName, dailyRoomUrl: roomUrl } = live;
    if (!roomName || !roomUrl) {
      const exp = Math.floor(Date.now() / 1000) + (live.dureeMinutes + 30) * 60;
      const nouvelle = await this.daily.createRoom(`entreprise-live-${live.id}`, exp, true);
      if (!nouvelle.configured || !nouvelle.roomName || !nouvelle.roomUrl) {
        return { configured: nouvelle.configured, url: null as string | null };
      }
      roomName = nouvelle.roomName;
      roomUrl = nouvelle.roomUrl;
      await this.prisma.entrepriseLive.update({
        where: { id: live.id },
        data: { dailyRoomName: roomName, dailyRoomUrl: roomUrl, statut: "en_direct" },
      });
    }
    const token = await this.daily.mintMeetingToken({
      roomName,
      userId: `entreprise-${entreprise.id}`,
      userName: entreprise.raisonSociale,
      isOwner: true,
    });
    return { configured: true, url: token ? `${roomUrl}?t=${token}` : roomUrl };
  }

  // Lecture publique — pages /communaute et /forum (voir
  // EntreprisesComptesController, sans guard).
  async listLivesPublics() {
    return this.prisma.entrepriseLive.findMany({
      where: { statut: { in: ["planifie", "en_direct"] } },
      select: { id: true, titre: true, description: true, startAt: true, dureeMinutes: true, statut: true, entreprise: { select: { raisonSociale: true } } },
      orderBy: { startAt: "asc" },
    });
  }

  // ---- Stand virtuel au forum -------------------------------------------------

  async getStand(matricule: string) {
    const entreprise = await this.chargerEntreprise(matricule);
    return this.prisma.standForum.findFirst({ where: { entrepriseId: entreprise.id } });
  }

  async upsertStand(matricule: string, dto: UpsertStandForumDto) {
    const entreprise = await this.chargerEntreprise(matricule);
    const existant = await this.prisma.standForum.findFirst({ where: { entrepriseId: entreprise.id } });
    const data = {
      nom: dto.nom,
      presentation: dto.presentation ?? null,
      offresTexte: dto.offresTexte ?? null,
      creneauxEntretien: dto.creneauxEntretien ?? null,
      statut: dto.publie ? "publie" : "brouillon",
    };
    if (existant) return this.prisma.standForum.update({ where: { id: existant.id }, data });
    return this.prisma.standForum.create({ data: { entrepriseId: entreprise.id, ...data } });
  }

  // Lecture publique — page /forum.
  async listStandsPublics() {
    return this.prisma.standForum.findMany({
      where: { statut: "publie" },
      select: {
        id: true,
        nom: true,
        presentation: true,
        offresTexte: true,
        creneauxEntretien: true,
        entreprise: { select: { raisonSociale: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }
}
