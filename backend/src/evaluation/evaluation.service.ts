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

const ALLOWED_LEVEL_VALUES: number[] = GRADING_LEVELS.map((l) => l.value);

const REQUIRED_SITUATION_COUNT = 5;

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
      include: { situationResponses: true, candidat: true },
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

    await this.sendResultEmail(attemptId);
  }

  async sendResultEmail(attemptId: string) {
    const attempt = await this.getAttemptOrThrow(attemptId);
    if (attempt.status !== "corrige" || !attempt.tier) {
      throw new BadRequestException(
        "La correction de cette tentative n'est pas terminée."
      );
    }

    const tierLabels: Record<string, string> = {
      refuse: "Non retenu pour le moment",
      formation_b1: "Orienté vers la formation de renforcement B1",
      niveau_b2: "Niveau B2 validé",
      niveau_c1:
        "Niveau C1 validé — formation intensive complémentaire de 10 jours",
      placement_direct: "Placement direct en production",
    };

    await this.email.send({
      to: attempt.candidat.email,
      subject: "Résultat de votre évaluation e-Staf",
      text: `Bonjour ${attempt.candidat.firstName},\n\nVotre évaluation a été traitée.\nRésultat : ${tierLabels[attempt.tier]}.\n\nL'équipe e-Staf reviendra vers vous avec les prochaines étapes.`,
    });

    return this.prisma.evaluationAttempt.update({
      where: { id: attemptId },
      data: { status: "resultat_envoye", resultEmailSentAt: new Date() },
    });
  }
}
