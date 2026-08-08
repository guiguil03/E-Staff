import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as path from "path";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { StorageService } from "../common/storage.service";
import { CreateCandidatDto } from "./dto/create-candidat.dto";
import { SubmitAnswersDto } from "./dto/submit-answers.dto";
import { ValidateContractDto } from "./dto/validate-contract.dto";
import { SubmitPaymentReferenceDto } from "./dto/submit-payment-reference.dto";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";
import { computeTier, computeTotalScore } from "./scoring";
import {
  LEXIQUE_QUESTIONS,
  ORAL_QUESTIONS,
  scoreQcm,
} from "./questions";
import {
  GRADING_LEVELS,
  SITUATION_GRADING_CRITERIA,
  SITUATIONS,
} from "./situations";
import { generateContractPdf } from "./contract-pdf";

const ALLOWED_LEVEL_VALUES: number[] = GRADING_LEVELS.map((l) => l.value);

const REQUIRED_SITUATION_COUNT = 5;

// Nombre max d'apprenants par groupe (6 groupes A-F × 5 = 30, voir Cockpit
// Formateur) — utilisé pour afficher les places restantes à l'admin lors de
// la confirmation de paiement, pas une contrainte dure en base.
const MAX_APPRENANTS_PAR_GROUPE = 5;

export const TIER_LABELS: Record<string, string> = {
  refuse: "Non retenu pour le moment",
  formation_b1: "Orienté vers la formation de renforcement B1",
  niveau_b2: "Niveau B2 validé",
  niveau_c1: "Niveau C1 validé — formation intensive complémentaire de 10 jours",
  placement_direct: "Placement direct en production",
};

@Injectable()
export class EvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly storage: StorageService
  ) {}

  getSituations() {
    return SITUATIONS;
  }

  getGradingCriteria() {
    return SITUATION_GRADING_CRITERIA;
  }

  getQuestions() {
    // On ne renvoie jamais correctChoice au front.
    const strip = (q: { id: string; prompt: string; choices: string[] }) => ({
      id: q.id,
      prompt: q.prompt,
      choices: q.choices,
    });
    return {
      lexique: LEXIQUE_QUESTIONS.map(strip),
      oral: ORAL_QUESTIONS.map(strip),
    };
  }

  async createCandidat(dto: CreateCandidatDto) {
    const candidat = await this.prisma.candidat.create({ data: dto });
    const attempt = await this.prisma.evaluationAttempt.create({
      data: { candidatId: candidat.id },
    });
    return { candidatId: candidat.id, attemptId: attempt.id };
  }

  private async getAttemptOrThrow(attemptId: string) {
    const attempt = await this.prisma.evaluationAttempt.findUnique({
      where: { id: attemptId },
      include: { situationResponses: true, candidat: true, apprenant: true },
    });
    if (!attempt) throw new NotFoundException("Tentative introuvable.");
    return attempt;
  }

  async submitAnswers(attemptId: string, dto: SubmitAnswersDto) {
    const attempt = await this.getAttemptOrThrow(attemptId);
    if (attempt.status !== "en_cours") {
      throw new BadRequestException("Cette tentative a déjà été soumise.");
    }

    const lexiqueScore = scoreQcm(LEXIQUE_QUESTIONS, dto.lexiqueAnswers);
    const oralScore = scoreQcm(ORAL_QUESTIONS, dto.oralAnswers);

    return this.prisma.evaluationAttempt.update({
      where: { id: attemptId },
      data: {
        lexiqueAnswers: JSON.stringify(dto.lexiqueAnswers),
        oralAnswers: JSON.stringify(dto.oralAnswers),
        lexiqueScore,
        oralScore,
        status: "soumis",
        submittedAt: new Date(),
      },
    });
  }

  async saveSituationAudio(
    attemptId: string,
    situationIndex: number,
    file: Express.Multer.File
  ) {
    const attempt = await this.getAttemptOrThrow(attemptId);
    if (attempt.status === "en_cours") {
      throw new BadRequestException(
        "Répondez d'abord aux épreuves lexique et compréhension orale."
      );
    }
    const already = attempt.situationResponses.length;
    const isNew = !attempt.situationResponses.some(
      (r) => r.situationIndex === situationIndex
    );
    if (isNew && already >= REQUIRED_SITUATION_COUNT) {
      throw new BadRequestException(
        `Vous avez déjà enregistré ${REQUIRED_SITUATION_COUNT} situations.`
      );
    }

    const extension = path.extname(file.originalname) || ".webm";
    const key = `evaluations/${attemptId}/situation-${situationIndex}${extension}`;
    await this.storage.uploadBuffer(
      key,
      file.buffer,
      file.mimetype || "audio/webm"
    );

    return this.prisma.situationResponse.upsert({
      where: {
        attemptId_situationIndex: { attemptId, situationIndex },
      },
      create: {
        attemptId,
        situationIndex,
        audioUrl: key,
      },
      update: {
        audioUrl: key,
        score: null,
        gradedCriteria: null,
        gradedAt: null,
      },
    });
  }

  async getSituationAudioStream(situationResponseId: string) {
    const response = await this.prisma.situationResponse.findUnique({
      where: { id: situationResponseId },
    });
    if (!response) throw new NotFoundException("Réponse introuvable.");

    try {
      return await this.storage.getObjectStream(response.audioUrl);
    } catch {
      throw new NotFoundException("Fichier audio introuvable.");
    }
  }

  // ---- Formateur --------------------------------------------------------

  async listAttemptsForGrading() {
    return this.prisma.evaluationAttempt.findMany({
      where: { status: { in: ["soumis", "en_correction"] } },
      include: { candidat: true, situationResponses: true },
      orderBy: { submittedAt: "asc" },
    });
  }

  async getAttemptForGrading(attemptId: string) {
    return this.getAttemptOrThrow(attemptId);
  }

  async gradeSituationResponse(
    situationResponseId: string,
    criteria: Record<string, number>
  ) {
    const response = await this.prisma.situationResponse.findUnique({
      where: { id: situationResponseId },
    });
    if (!response) throw new NotFoundException("Réponse introuvable.");

    for (const c of SITUATION_GRADING_CRITERIA) {
      const value = criteria[c.key];
      if (typeof value !== "number" || !ALLOWED_LEVEL_VALUES.includes(value)) {
        throw new BadRequestException(
          `Critère "${c.label}" : merci de sélectionner un échelon valide (0.25 / 0.5 / 0.75 / 1).`
        );
      }
    }

    const score = SITUATION_GRADING_CRITERIA.reduce(
      (total, c) => total + criteria[c.key],
      0
    );

    await this.prisma.situationResponse.update({
      where: { id: situationResponseId },
      data: {
        score,
        gradedCriteria: JSON.stringify(criteria),
        gradedAt: new Date(),
      },
    });

    await this.recomputeAttemptIfComplete(response.attemptId);

    return this.prisma.situationResponse.findUnique({
      where: { id: situationResponseId },
    });
  }

  private async recomputeAttemptIfComplete(attemptId: string) {
    const attempt = await this.getAttemptOrThrow(attemptId);
    const graded = attempt.situationResponses.filter(
      (r) => r.gradedAt !== null
    );

    if (graded.length < REQUIRED_SITUATION_COUNT) {
      if (attempt.status === "soumis") {
        await this.prisma.evaluationAttempt.update({
          where: { id: attemptId },
          data: { status: "en_correction" },
        });
      }
      return;
    }

    const situationsScore = graded.reduce((sum, r) => sum + (r.score ?? 0), 0);
    const totalScore = computeTotalScore([
      attempt.lexiqueScore,
      attempt.oralScore,
      situationsScore,
    ]);
    const tier = totalScore === null ? null : computeTier(totalScore);

    await this.prisma.evaluationAttempt.update({
      where: { id: attemptId },
      data: {
        situationsScore,
        totalScore,
        tier,
        status: "corrige",
        gradedAt: new Date(),
      },
    });

    // Pas d'envoi automatique ici : la correction terminée ("corrige") place
    // la tentative en attente de validation RH (voir validateContract) — le
    // résultat et le contrat partent ensemble, une fois validés, au cron de
    // 20h (voir ContractCronService).
  }

  // ---- Pipeline post-test : validation RH -> contrat -> paiement --------

  async listPendingValidation() {
    return this.prisma.evaluationAttempt.findMany({
      where: { status: "corrige" },
      include: { candidat: true },
      orderBy: { gradedAt: "asc" },
    });
  }

  async validateContract(attemptId: string, dto: ValidateContractDto) {
    const attempt = await this.getAttemptOrThrow(attemptId);
    if (attempt.status !== "corrige" || !attempt.tier) {
      throw new BadRequestException(
        "Cette tentative n'est pas prête pour la validation (correction non terminée)."
      );
    }

    const pdf = await generateContractPdf({
      prenom: attempt.candidat.firstName,
      nom: attempt.candidat.lastName,
      email: attempt.candidat.email,
      tierLabel: TIER_LABELS[attempt.tier] ?? attempt.tier,
      totalScore: attempt.totalScore,
      duree: dto.duree,
      frais: dto.frais,
      conditions: dto.conditions,
    });
    const contractPdfKey = `contracts/${attemptId}.pdf`;
    await this.storage.uploadBuffer(contractPdfKey, pdf, "application/pdf");

    return this.prisma.evaluationAttempt.update({
      where: { id: attemptId },
      data: {
        contractDuree: dto.duree,
        contractFrais: dto.frais,
        contractConditions: dto.conditions,
        contractPdfKey,
        status: "valide_pret_envoi",
      },
    });
  }

  async getContractPdfStream(attemptId: string) {
    const attempt = await this.getAttemptOrThrow(attemptId);
    if (!attempt.contractPdfKey) {
      throw new NotFoundException("Contrat introuvable pour cette tentative.");
    }
    try {
      return await this.storage.getObjectStream(attempt.contractPdfKey);
    } catch {
      throw new NotFoundException("Fichier de contrat introuvable.");
    }
  }

  // Accès public (candidat) — la page contrat n'est accessible que via le
  // lien envoyé par e-mail (attemptId comme jeton), même principe que le
  // reste du parcours candidat sans compte.
  async getContractInfo(attemptId: string) {
    const attempt = await this.getAttemptOrThrow(attemptId);
    if (
      !["valide_pret_envoi", "contrat_envoye", "en_attente_paiement", "active"].includes(
        attempt.status
      )
    ) {
      throw new NotFoundException("Contrat pas encore disponible.");
    }
    return {
      status: attempt.status,
      prenom: attempt.candidat.firstName,
      nom: attempt.candidat.lastName,
      tierLabel: attempt.tier ? TIER_LABELS[attempt.tier] ?? attempt.tier : null,
      totalScore: attempt.totalScore,
      duree: attempt.contractDuree,
      frais: attempt.contractFrais,
      conditions: attempt.contractConditions,
      paymentReference: attempt.paymentReference,
      apprenantMatricule: attempt.apprenant?.matricule ?? null,
    };
  }

  async submitPaymentReference(attemptId: string, dto: SubmitPaymentReferenceDto) {
    const attempt = await this.getAttemptOrThrow(attemptId);
    if (attempt.status !== "contrat_envoye") {
      throw new BadRequestException(
        "Le contrat doit avoir été envoyé avant de transmettre une référence de paiement."
      );
    }
    return this.prisma.evaluationAttempt.update({
      where: { id: attemptId },
      data: { paymentReference: dto.reference, status: "en_attente_paiement" },
    });
  }

  // ---- Interface admin (RH) ----------------------------------------------

  async listPendingPayment() {
    return this.prisma.evaluationAttempt.findMany({
      where: { status: "en_attente_paiement" },
      include: { candidat: true },
      orderBy: { paymentConfirmedAt: "asc" },
    });
  }

  async listGroupesAvecPlaces() {
    const groupes = await this.prisma.groupe.findMany({
      include: { _count: { select: { apprenants: true } } },
      orderBy: { cle: "asc" },
    });
    return groupes.map((g) => ({
      id: g.id,
      cle: g.cle,
      label: g.label,
      placesRestantes: Math.max(0, MAX_APPRENANTS_PAR_GROUPE - g._count.apprenants),
    }));
  }

  private async generateNextMatricule(): Promise<string> {
    const existing = await this.prisma.apprenant.findMany({
      where: { matricule: { startsWith: "ETF-2026-" } },
      select: { matricule: true },
    });
    const maxN = existing.reduce((max, a) => {
      const m = /^ETF-2026-(\d+)$/.exec(a.matricule);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    return `ETF-2026-${String(maxN + 1).padStart(4, "0")}`;
  }

  async confirmPayment(attemptId: string, dto: ConfirmPaymentDto) {
    const attempt = await this.getAttemptOrThrow(attemptId);
    if (attempt.status !== "en_attente_paiement") {
      throw new BadRequestException(
        "Cette tentative n'est pas en attente de confirmation de paiement."
      );
    }
    const groupe = await this.prisma.groupe.findUnique({ where: { id: dto.groupeId } });
    if (!groupe) throw new NotFoundException("Groupe introuvable.");

    const matricule = await this.generateNextMatricule();
    const apprenant = await this.prisma.apprenant.create({
      data: {
        matricule,
        prenom: attempt.candidat.firstName,
        nom: attempt.candidat.lastName,
        email: attempt.candidat.email,
        groupeId: groupe.id,
      },
    });

    const updated = await this.prisma.evaluationAttempt.update({
      where: { id: attemptId },
      data: {
        apprenantId: apprenant.id,
        status: "active",
        paymentConfirmedAt: new Date(),
      },
    });

    await this.email.send({
      to: attempt.candidat.email,
      subject: "Bienvenue chez e-Staf — votre matricule",
      text: `Bonjour ${attempt.candidat.firstName},\n\nVotre paiement a bien été confirmé et votre place est validée dans le ${groupe.label}.\n\nVotre matricule e-Staf : ${matricule}\n\nUtilisez ce matricule pour vous connecter à votre tableau de bord personnel dès maintenant.\n\nÀ très vite,\nL'équipe e-Staf`,
    });

    return updated;
  }
}
