import * as path from "path";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage.service";
import { EmailService } from "../common/email.service";
import { renderEmailHtml, emailParagraph, ctaButton, escapeEmailHtml } from "../common/email-template";
import { GradeNotationDto } from "./dto/grade-notation.dto";

const APP_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// Libellés des compétences — dupliqué depuis
// components/compte-formateur/gradingGrids.ts (COMPETENCY_DEFS), même
// convention que COMPETENCY_KEYS ci-dessous. Sert uniquement au texte de
// l'e-mail "nouveau commentaire", pas de logique métier dessus.
const COMPETENCY_LABELS: Record<string, string> = {
  comprehension_orale: "Compréhension orale",
  expression_orale: "Expression orale",
  comprehension_ecrite: "Compréhension écrite",
  expression_ecrite: "Expression écrite",
  posture_eloquence: "Posture & Éloquence",
};

// Matricules de démo générés en série (ETF-2026-0001..0030) suivant
// exactement le même index que components/compte-formateur/exampleData.ts
// et prisma/seed.ts (id frontend "apprenant-N" ↔ matricule ETF-2026-000N) —
// c'est ce qui permet au frontend de retrouver le bon Apprenant réel sans
// appel réseau supplémentaire. Documenté ici pour que le lien ne soit pas
// une coïncidence silencieuse.

function parseGridData(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Compétences suivies séance après séance pendant la formation (voir
// components/compte-formateur/gradingGrids.ts, COMPETENCY_DEFS) — dupliqué
// ici (les clés seulement, pas les libellés, laissés au frontend) plutôt que
// partagé entre back et front, même convention que le reste du projet.
const COMPETENCY_KEYS = [
  "comprehension_orale",
  "expression_orale",
  "comprehension_ecrite",
  "expression_ecrite",
  "posture_eloquence",
];

// Retard toléré avant de compter une présence en retard sur le tableau de
// bord apprenant — au-delà, ça compte comme un retard, pas juste une entrée
// tardive dans la visio.
const RETARD_TOLERANCE_MINUTES = 10;

// Étiquette de semaine ISO ("AAAA-Wss") — même formule que
// RhService.isoWeekLabel / ProductionService.isoWeekLabel, dupliquée ici par
// convention du projet plutôt que partagée entre modules.
function isoWeekLabel(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class NotationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly email: EmailService
  ) {}

  private async findGroupeOrThrow(groupeCle: string) {
    const groupe = await this.prisma.groupe.findUnique({ where: { cle: groupeCle } });
    if (!groupe) throw new NotFoundException(`Groupe ${groupeCle} introuvable.`);
    return groupe;
  }

  private async findFormateurOrThrow(matricule: string) {
    const formateur = await this.prisma.formateur.findUnique({ where: { matricule } });
    if (!formateur) throw new NotFoundException(`Formateur ${matricule} introuvable.`);
    return formateur;
  }

  // Un formateur n'agit que sur les groupes qui lui sont assignés (voir
  // Groupe.formateurId, assigné par la RH — FormateursPanel) — sécurité
  // réelle depuis que chaque formateur a son propre compte individuel
  // (2026-09-16), pas juste une séparation d'affichage. formateurMatricule
  // reste optionnel pour ne pas casser un futur appel interne sans contexte
  // formateur (aucun aujourd'hui, mais évite un couplage inutile).
  private async findGroupeOrThrowOwned(groupeCle: string, formateurMatricule?: string) {
    const groupe = await this.findGroupeOrThrow(groupeCle);
    if (formateurMatricule) {
      const formateur = await this.findFormateurOrThrow(formateurMatricule);
      if (groupe.formateurId !== formateur.id) {
        throw new ForbiddenException(`Vous n'encadrez pas le groupe ${groupeCle}.`);
      }
    }
    return groupe;
  }

  private async findSeanceOrThrow(groupeCle: string, numero: number, formateurMatricule?: string) {
    const groupe = await this.findGroupeOrThrowOwned(groupeCle, formateurMatricule);
    const seance = await this.prisma.seance.findUnique({
      where: { groupeId_numero: { groupeId: groupe.id, numero } },
    });
    if (!seance) throw new NotFoundException(`Séance n°${numero} introuvable pour le groupe ${groupeCle}.`);
    return seance;
  }

  private async findApprenantOrThrow(matricule: string) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant) throw new NotFoundException(`Apprenant ${matricule} introuvable.`);
    return apprenant;
  }

  private serialize(n: {
    id: string;
    competence: string;
    fileKey: string | null;
    fileName: string | null;
    soumisAt: Date | null;
    gridData: string | null;
    note: number | null;
    commentaires: string | null;
    scoreOn20: number | null;
    gradedAt: Date | null;
  }) {
    return {
      id: n.id,
      competence: n.competence,
      fileName: n.fileName,
      soumisAt: n.soumisAt,
      gridData: parseGridData(n.gridData),
      note: n.note,
      commentaires: n.commentaires,
      scoreOn20: n.scoreOn20,
      gradedAt: n.gradedAt,
    };
  }

  // ---- Formateur (Noter / Planning) --------------------------------------

  async getNotation(
    groupeCle: string,
    numero: number,
    apprenantMatricule: string,
    competence: string,
    formateurMatricule?: string
  ) {
    const seance = await this.findSeanceOrThrow(groupeCle, numero, formateurMatricule);
    const apprenant = await this.findApprenantOrThrow(apprenantMatricule);
    const notation = await this.prisma.notation.findUnique({
      where: { seanceId_apprenantId_competence: { seanceId: seance.id, apprenantId: apprenant.id, competence } },
    });
    return notation ? this.serialize(notation) : null;
  }

  async gradeNotation(
    groupeCle: string,
    numero: number,
    apprenantMatricule: string,
    competence: string,
    dto: GradeNotationDto,
    formateurMatricule?: string
  ) {
    const seance = await this.findSeanceOrThrow(groupeCle, numero, formateurMatricule);
    const apprenant = await this.findApprenantOrThrow(apprenantMatricule);

    const existing = await this.prisma.notation.findUnique({
      where: { seanceId_apprenantId_competence: { seanceId: seance.id, apprenantId: apprenant.id, competence } },
    });

    const gridDataStr = dto.gridData !== undefined ? JSON.stringify(dto.gridData) : undefined;
    const notation = await this.prisma.notation.upsert({
      where: { seanceId_apprenantId_competence: { seanceId: seance.id, apprenantId: apprenant.id, competence } },
      create: {
        seanceId: seance.id,
        apprenantId: apprenant.id,
        competence,
        gridData: gridDataStr,
        note: dto.note,
        commentaires: dto.commentaires,
        scoreOn20: dto.scoreOn20,
        gradedAt: new Date(),
      },
      update: {
        gridData: gridDataStr,
        note: dto.note,
        commentaires: dto.commentaires,
        scoreOn20: dto.scoreOn20,
        gradedAt: new Date(),
      },
    });

    // E-mail immédiat seulement si le commentaire est nouveau ou a changé —
    // une simple correction de note/grille sans y toucher ne redéclenche pas
    // l'envoi (évite de spammer l'apprenant à chaque enregistrement).
    const nouveauCommentaire = dto.commentaires?.trim();
    if (nouveauCommentaire && nouveauCommentaire !== existing?.commentaires?.trim()) {
      const competenceLabel = COMPETENCY_LABELS[competence] ?? competence;
      await this.email.send({
        to: apprenant.email,
        subject: `Nouveau commentaire de votre formateur — Séance ${numero}`,
        text: `Bonjour ${apprenant.prenom},\n\nVotre formateur a laissé un commentaire sur votre évaluation "${competenceLabel}" (séance n°${numero}) :\n\n« ${nouveauCommentaire} »\n\nConsultez le détail depuis votre tableau de bord :\n${APP_URL}/compte/apprenant\n\nL'équipe e-Staf`,
        html: renderEmailHtml({
          title: "Nouveau commentaire de votre formateur",
          preheader: `Séance ${numero} — ${competenceLabel}`,
          bodyHtml:
            emailParagraph(`Bonjour ${apprenant.prenom},`) +
            emailParagraph(
              `Votre formateur a laissé un commentaire sur votre évaluation « ${competenceLabel} » (séance n°${numero}) :`
            ) +
            `<blockquote style="margin:0 0 20px;padding:12px 16px;border-left:3px solid #B8973E;font-family:'IBM Plex Sans',sans-serif;font-style:italic;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.85);">${escapeEmailHtml(nouveauCommentaire)}</blockquote>` +
            ctaButton("Voir le détail", `${APP_URL}/compte/apprenant`),
        }),
      });
    }

    return this.serialize(notation);
  }

  // Tableau récap Planning — toutes les notations de tous les apprenants du
  // groupe pour cette séance, clé par matricule.
  async listNotationsForSeance(groupeCle: string, numero: number, formateurMatricule?: string) {
    const seance = await this.findSeanceOrThrow(groupeCle, numero, formateurMatricule);
    const notations = await this.prisma.notation.findMany({
      where: { seanceId: seance.id },
      include: { apprenant: true },
    });
    const parNotation: Record<string, Record<string, { scoreOn20: number | null }>> = {};
    for (const n of notations) {
      parNotation[n.apprenant.matricule] ??= {};
      parNotation[n.apprenant.matricule][n.competence] = { scoreOn20: n.scoreOn20 };
    }
    return parNotation;
  }

  // ---- Apprenant (lecture + dépôt) ----------------------------------------

  // Les 12 séances du groupe de l'apprenant + ses notations pour chacune —
  // alimente son tableau séances × compétences.
  async listApprenantNotations(matricule: string) {
    const apprenant = await this.findApprenantOrThrow(matricule);
    const seances = await this.prisma.seance.findMany({
      where: { groupeId: apprenant.groupeId },
      orderBy: { numero: "asc" },
      include: { notations: { where: { apprenantId: apprenant.id } } },
    });
    return seances.map((s) => ({
      numero: s.numero,
      startAt: s.startAt,
      notations: s.notations.map((n) => this.serialize(n)),
    }));
  }

  // Page d'accueil du Compte Apprenant — consolide Apprenant, EvaluationAttempt
  // (diagnostic initial du test d'admission), Seance/Presence (assiduité,
  // prochaine séance) et Notation (évaluation cumulée, alerte pédagogique,
  // commentaire du formateur) en un seul appel. Même principe de façade que
  // RhService.getApprenantCasier côté RH, mais self-service (pas de garde,
  // matricule comme identifiant, comme le reste de ce contrôleur) : chaque
  // valeur reflète une vraie donnée ou reste null/vide, jamais un chiffre
  // inventé pour combler un module pas encore construit (quotas
  // d'annulation, contrat en ligne... — voir MonDossier.tsx).
  async getApprenantDashboard(matricule: string) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { matricule },
      include: {
        groupe: { include: { formateur: true } },
        evaluationAttempt: true,
      },
    });
    if (!apprenant) throw new NotFoundException(`Apprenant ${matricule} introuvable.`);

    const [seances, presences, notationsNotees] = await Promise.all([
      this.prisma.seance.findMany({
        where: { groupeId: apprenant.groupeId },
        orderBy: { numero: "asc" },
      }),
      this.prisma.presence.findMany({ where: { apprenantId: apprenant.id } }),
      this.prisma.notation.findMany({
        where: { apprenantId: apprenant.id, scoreOn20: { not: null } },
      }),
    ]);

    const now = new Date();

    // ---- Séances & prochaine séance ----------------------------------
    const seancesPassees = seances.filter((s) => s.startAt !== null && s.startAt <= now);
    const prochaine = seances.find((s) => s.startAt !== null && s.startAt > now) ?? null;

    // ---- Assiduité (4 dernières semaines ISO ayant une séance passée) -
    const presenceParSeance = new Map(presences.map((p) => [p.seanceId, p]));
    const parSemaine = new Map<string, { total: number; absences: number; retards: number }>();
    for (const s of seancesPassees) {
      const semaine = isoWeekLabel(s.startAt!);
      const entry = parSemaine.get(semaine) ?? { total: 0, absences: 0, retards: 0 };
      entry.total += 1;
      const presence = presenceParSeance.get(s.id);
      if (!presence) {
        entry.absences += 1;
      } else if (
        (presence.joinedAt.getTime() - s.startAt!.getTime()) / 60000 >
        RETARD_TOLERANCE_MINUTES
      ) {
        entry.retards += 1;
      }
      parSemaine.set(semaine, entry);
    }
    const assiduite = Array.from(parSemaine.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-4)
      .map(([semaine, e]) => {
        const tauxAbsence = e.total > 0 ? Math.round((e.absences / e.total) * 100) : 0;
        return {
          semaine,
          tauxAbsence,
          retards: e.retards,
          statut: (tauxAbsence > 0 || e.retards > 0 ? "attention" : "ok") as "ok" | "attention",
        };
      });

    // ---- Évaluation cumulée : moyenne par compétence -------------------
    const scoresParCompetence = new Map<string, number[]>();
    for (const n of notationsNotees) {
      const list = scoresParCompetence.get(n.competence) ?? [];
      list.push(n.scoreOn20!);
      scoresParCompetence.set(n.competence, list);
    }
    const moyennesParCompetence = COMPETENCY_KEYS.map((key) => {
      const scores = scoresParCompetence.get(key) ?? [];
      return scores.length > 0
        ? { key, score: round2(scores.reduce((a, b) => a + b, 0) / scores.length) }
        : null;
    }).filter((v): v is { key: string; score: number } => v !== null);

    const tauxReussiteGlobal =
      moyennesParCompetence.length > 0
        ? Math.round(
            (moyennesParCompetence.reduce((s, c) => s + c.score, 0) /
              moyennesParCompetence.length /
              20) *
              100
          )
        : null;

    const alerteCompetence =
      moyennesParCompetence.length > 0
        ? moyennesParCompetence.reduce((min, c) => (c.score < min.score ? c : min))
        : null;

    // ---- Cumul du mois (notations gradées ce mois-ci) ------------------
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const notationsCeMois = notationsNotees.filter(
      (n) => n.gradedAt !== null && n.gradedAt >= debutMois
    );
    const tauxEvolutionMensuel =
      notationsCeMois.length > 0
        ? Math.round(
            (notationsCeMois.reduce((s, n) => s + n.scoreOn20!, 0) / notationsCeMois.length / 20) *
              100
          )
        : 0;

    // ---- Dernier commentaire du formateur -------------------------------
    const dernierCommente = notationsNotees
      .filter((n) => n.commentaires && n.commentaires.trim().length > 0 && n.gradedAt !== null)
      .sort((a, b) => b.gradedAt!.getTime() - a.gradedAt!.getTime())[0];
    const commentaireFormateur = dernierCommente
      ? {
          text: dernierCommente.commentaires!,
          author: apprenant.groupe.formateur
            ? `${apprenant.groupe.formateur.prenom} ${apprenant.groupe.formateur.nom}, Formateur`
            : "L'équipe pédagogique",
        }
      : null;

    // ---- Diagnostic initial (test d'admission) --------------------------
    const attempt = apprenant.evaluationAttempt;
    const diagnosticInitial = attempt
      ? {
          tier: attempt.tier,
          totalScore: attempt.totalScore,
          blocs: [
            { key: "lexique", label: "Lexique", score: attempt.lexiqueScore ?? 0 },
            { key: "oral", label: "Oral", score: attempt.oralScore ?? 0 },
            { key: "situations", label: "Situations", score: attempt.situationsScore ?? 0 },
            { key: "video", label: "Vidéo", score: attempt.videoScore ?? 0 },
            { key: "essai", label: "Essai", score: attempt.essayScore ?? 0 },
          ],
        }
      : null;

    return {
      prenom: apprenant.prenom,
      groupeLabel: apprenant.groupe.label,
      typeCours: apprenant.groupe.typeCours,
      dateInscription: apprenant.createdAt,
      abonnementExpireAt: apprenant.abonnementExpireAt,
      seancesTotal: seances.length,
      seancesEffectuees: seancesPassees.length,
      prochaineSeance: prochaine
        ? {
            numero: prochaine.numero,
            titre: prochaine.objectifs ?? `Séance ${prochaine.numero}`,
            startAt: prochaine.startAt,
          }
        : null,
      diagnosticInitial,
      tauxReussiteGlobal,
      tauxEvolutionMensuel,
      alerteCompetence,
      commentaireFormateur,
      assiduite,
    };
  }

  async getApprenantNotationDetail(matricule: string, numero: number, competence: string) {
    const apprenant = await this.findApprenantOrThrow(matricule);
    const seance = await this.prisma.seance.findUnique({
      where: { groupeId_numero: { groupeId: apprenant.groupeId, numero } },
    });
    if (!seance) throw new NotFoundException(`Séance n°${numero} introuvable.`);
    const notation = await this.prisma.notation.findUnique({
      where: { seanceId_apprenantId_competence: { seanceId: seance.id, apprenantId: apprenant.id, competence } },
    });
    return notation ? this.serialize(notation) : null;
  }

  // Dépôt de devoir — remet la notation à zéro si un devoir précédent avait
  // déjà été corrigé (redépôt après retour du formateur), même logique que
  // EvaluationService.saveSituationAudio.
  async uploadDevoir(matricule: string, numero: number, competence: string, file: Express.Multer.File) {
    const apprenant = await this.findApprenantOrThrow(matricule);
    const seance = await this.prisma.seance.findUnique({
      where: { groupeId_numero: { groupeId: apprenant.groupeId, numero } },
    });
    if (!seance) throw new NotFoundException(`Séance n°${numero} introuvable.`);

    const extension = path.extname(file.originalname) || "";
    const key = `devoirs/${apprenant.id}/${seance.id}-${competence}${extension}`;
    await this.storage.uploadBuffer(key, file.buffer, file.mimetype || "application/octet-stream");

    const notation = await this.prisma.notation.upsert({
      where: { seanceId_apprenantId_competence: { seanceId: seance.id, apprenantId: apprenant.id, competence } },
      create: {
        seanceId: seance.id,
        apprenantId: apprenant.id,
        competence,
        fileKey: key,
        fileName: file.originalname,
        soumisAt: new Date(),
      },
      update: {
        fileKey: key,
        fileName: file.originalname,
        soumisAt: new Date(),
        scoreOn20: null,
        gradedAt: null,
      },
    });
    return this.serialize(notation);
  }

  // ---- File d'attente "Évaluer & Corriger" --------------------------------

  // Filtrée aux seuls groupes du formateur connecté (voir Groupe.formateurId)
  // — avant les comptes individuels, cette file montrait tout le monde à
  // tout le monde puisqu'il n'y avait qu'un seul compte formateur partagé.
  async listACorriger(formateurMatricule?: string) {
    const formateur = formateurMatricule
      ? await this.findFormateurOrThrow(formateurMatricule)
      : null;
    const notations = await this.prisma.notation.findMany({
      where: {
        fileKey: { not: null },
        gradedAt: null,
        ...(formateur ? { seance: { groupe: { formateurId: formateur.id } } } : {}),
      },
      include: { apprenant: true, seance: { include: { groupe: true } } },
      orderBy: { soumisAt: "asc" },
    });
    return notations.map((n) => ({
      id: n.id,
      apprenantMatricule: n.apprenant.matricule,
      apprenantPrenom: n.apprenant.prenom,
      apprenantNom: n.apprenant.nom,
      groupeCle: n.seance.groupe.cle,
      groupeLabel: n.seance.groupe.label,
      numero: n.seance.numero,
      competence: n.competence,
      fileName: n.fileName,
      soumisAt: n.soumisAt,
    }));
  }

  async getDevoirStream(notationId: string, formateurMatricule?: string) {
    const notation = await this.prisma.notation.findUnique({
      where: { id: notationId },
      include: { seance: { include: { groupe: true } } },
    });
    if (!notation?.fileKey) throw new NotFoundException("Devoir introuvable.");
    if (formateurMatricule) {
      const formateur = await this.findFormateurOrThrow(formateurMatricule);
      if (notation.seance.groupe.formateurId !== formateur.id) {
        throw new ForbiddenException(`Vous n'encadrez pas le groupe ${notation.seance.groupe.cle}.`);
      }
    }
    try {
      return await this.storage.getObjectStream(notation.fileKey);
    } catch {
      throw new NotFoundException("Fichier introuvable.");
    }
  }
}
