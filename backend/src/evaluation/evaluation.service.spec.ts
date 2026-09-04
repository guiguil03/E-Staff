import * as bcrypt from "bcryptjs";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { EvaluationService, TIER_LABELS } from "./evaluation.service";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { StorageService } from "../common/storage.service";
import { computeTier, computeTotalScore } from "./scoring";
import { SITUATION_GRADING_CRITERIA, GRADING_LEVELS } from "./situations";
import { VIDEO_GRADING_CRITERIA, VIDEO_GRADING_LEVELS } from "./video-tasks";
import { ESSAY_GRADING_CRITERIA, ESSAY_GRADING_LEVELS } from "./commentaire-argumentatif";
import { PARTIE_OUVERTE_GRADING_CRITERIA } from "./partie-ouverte";

function makePrismaMock() {
  return {
    evaluationAttempt: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    situationResponse: { findUnique: jest.fn(), update: jest.fn(), upsert: jest.fn() },
    videoResponse: { findUnique: jest.fn(), update: jest.fn(), upsert: jest.fn() },
    essayResponse: { findUnique: jest.fn(), update: jest.fn(), upsert: jest.fn() },
    ecritOuvertResponse: { findUnique: jest.fn(), update: jest.fn(), upsert: jest.fn() },
    apprenant: { findMany: jest.fn(), create: jest.fn() },
    groupe: { findUnique: jest.fn() },
  };
}

const CANDIDAT = {
  id: "cand-1",
  firstName: "Awa",
  lastName: "Diallo",
  email: "awa@example.com",
};

function baseAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: "attempt-1",
    status: "en_cours",
    lexiqueAnswers: null,
    lexiqueQcmScore: null,
    oralAnswers: null,
    oralScore: null,
    lexiqueScore: null,
    situationsScore: null,
    videoScore: null,
    essayScore: null,
    totalScore: null,
    tier: null,
    rhNotifiedAt: null,
    situationResponses: [],
    videoResponses: [],
    essayResponse: null,
    ecritOuvertResponse: null,
    candidat: CANDIDAT,
    apprenant: null,
    ...overrides,
  };
}

function maxSituationCriteria() {
  const max = GRADING_LEVELS[GRADING_LEVELS.length - 1].value;
  return Object.fromEntries(SITUATION_GRADING_CRITERIA.map((c) => [c.key, max]));
}
function maxVideoCriteria() {
  const max = VIDEO_GRADING_LEVELS[VIDEO_GRADING_LEVELS.length - 1].value;
  return Object.fromEntries(VIDEO_GRADING_CRITERIA.map((c) => [c.key, max]));
}
function maxEssayCriteria() {
  const max = ESSAY_GRADING_LEVELS[ESSAY_GRADING_LEVELS.length - 1].value;
  return Object.fromEntries(ESSAY_GRADING_CRITERIA.map((c) => [c.key, max]));
}
function maxPartieOuverteCriteria() {
  return Object.fromEntries(PARTIE_OUVERTE_GRADING_CRITERIA.map((c) => [c.key, c.maxPoints]));
}

describe("EvaluationService", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let email: { send: jest.Mock };
  let storage: { uploadBuffer: jest.Mock; getObjectStream: jest.Mock };
  let service: EvaluationService;

  beforeEach(() => {
    prisma = makePrismaMock();
    email = { send: jest.fn().mockResolvedValue({ delivered: true }) };
    storage = { uploadBuffer: jest.fn(), getObjectStream: jest.fn() };
    service = new EvaluationService(
      prisma as unknown as PrismaService,
      email as unknown as EmailService,
      storage as unknown as StorageService
    );
    delete process.env.RH_NOTIFICATION_EMAIL;
  });

  describe("submitAnswers + finalisation automatique", () => {
    it("rejette si la tentative n'est plus en_cours", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue(baseAttempt({ status: "soumis" }));
      await expect(service.submitAnswers("attempt-1", { lexiqueAnswers: {} })).rejects.toThrow(
        BadRequestException
      );
      expect(prisma.evaluationAttempt.update).not.toHaveBeenCalled();
    });

    it("ne finalise pas tant que tous les blocs ne sont pas complets", async () => {
      // Tentative incomplète : essayResponse manquant.
      prisma.evaluationAttempt.findUnique.mockResolvedValue(
        baseAttempt({
          lexiqueAnswers: "{}",
          ecritOuvertResponse: { score: 8 },
          oralAnswers: null,
          situationResponses: new Array(5).fill({}),
          videoResponses: new Array(2).fill({}),
          essayResponse: null,
        })
      );

      await service.submitAnswers("attempt-1", { oralAnswers: { q1: "a" } });

      // Un seul update : celui de submitAnswers lui-même, maybeFinalize ne
      // déclenche rien puisque essayResponse est toujours manquant.
      expect(prisma.evaluationAttempt.update).toHaveBeenCalledTimes(1);
      expect(prisma.evaluationAttempt.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: "soumis" }) })
      );
    });

    it("bascule en 'soumis' dès que le dernier bloc manquant est complété, quel qu'il soit", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue(
        baseAttempt({
          lexiqueAnswers: "{}",
          ecritOuvertResponse: { score: 8 },
          oralAnswers: "{}",
          situationResponses: new Array(5).fill({}),
          videoResponses: new Array(2).fill({}),
          essayResponse: { score: 9 },
        })
      );

      await service.submitAnswers("attempt-1", { oralAnswers: { q1: "a" } });

      expect(prisma.evaluationAttempt.update).toHaveBeenCalledTimes(2);
      const finalizeCall = prisma.evaluationAttempt.update.mock.calls[1][0];
      expect(finalizeCall.data.status).toBe("soumis");
      expect(finalizeCall.data.submittedAt).toBeInstanceOf(Date);
    });
  });

  describe("gradeSituationResponse — validation", () => {
    it("rejette une note hors des échelons autorisés (0.25/0.5/0.75/1)", async () => {
      prisma.situationResponse.findUnique.mockResolvedValue({ id: "s-1", attemptId: "attempt-1" });
      const invalid = { ...maxSituationCriteria(), [SITUATION_GRADING_CRITERIA[0].key]: 0.3 };
      await expect(service.gradeSituationResponse("s-1", invalid)).rejects.toThrow(
        BadRequestException
      );
      expect(prisma.situationResponse.update).not.toHaveBeenCalled();
    });

    it("lève NotFoundException si la réponse n'existe pas", async () => {
      prisma.situationResponse.findUnique.mockResolvedValue(null);
      await expect(service.gradeSituationResponse("inconnu", maxSituationCriteria())).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("recomputeAttemptIfComplete (via les endpoints de notation)", () => {
    it("passe la tentative en 'en_correction' si elle était 'soumis' et reste incomplète", async () => {
      prisma.videoResponse.findUnique.mockResolvedValue({ id: "v-1", attemptId: "attempt-1" });
      prisma.videoResponse.update.mockResolvedValue({});
      prisma.evaluationAttempt.findUnique.mockResolvedValue(
        baseAttempt({
          status: "soumis",
          situationResponses: [], // encore rien de gradé
          videoResponses: [{ gradedAt: new Date(), score: 7 }],
          essayResponse: null,
          ecritOuvertResponse: null,
        })
      );

      await service.gradeVideoResponse("v-1", maxVideoCriteria());

      expect(prisma.evaluationAttempt.update).toHaveBeenCalledWith({
        where: { id: "attempt-1" },
        data: { status: "en_correction" },
      });
    });

    it("ne touche pas au statut si déjà 'en_correction' et toujours incomplet", async () => {
      prisma.videoResponse.findUnique.mockResolvedValue({ id: "v-1", attemptId: "attempt-1" });
      prisma.videoResponse.update.mockResolvedValue({});
      prisma.evaluationAttempt.findUnique.mockResolvedValue(
        baseAttempt({ status: "en_correction", situationResponses: [], videoResponses: [] })
      );

      await service.gradeVideoResponse("v-1", maxVideoCriteria());

      expect(prisma.evaluationAttempt.update).not.toHaveBeenCalled();
    });

    it("calcule le score total et le tier une fois tous les blocs corrigés, et passe en 'corrige'", async () => {
      prisma.videoResponse.findUnique.mockResolvedValue({ id: "v-1", attemptId: "attempt-1" });
      prisma.videoResponse.update.mockResolvedValue({});

      const situationResponses = [
        { gradedAt: new Date(), score: 3.5 },
        { gradedAt: new Date(), score: 3.5 },
        { gradedAt: new Date(), score: 3.5 },
        { gradedAt: new Date(), score: 3.5 },
        { gradedAt: new Date(), score: 3.5 },
      ];
      const videoResponses = [
        { gradedAt: new Date(), score: 7 },
        { gradedAt: new Date(), score: 7 },
      ];
      const attempt = baseAttempt({
        lexiqueQcmScore: 8,
        oralScore: 16,
        situationResponses,
        videoResponses,
        essayResponse: { gradedAt: new Date(), score: 9 },
        ecritOuvertResponse: { gradedAt: new Date(), score: 7 },
      });
      prisma.evaluationAttempt.findUnique.mockResolvedValue(attempt);

      await service.gradeVideoResponse("v-1", maxVideoCriteria());

      const lexiqueScore = 8 + 7;
      const situationsScore = 3.5 * 5;
      const videoScore = 14;
      const essayScore = 9;
      const expectedTotal = computeTotalScore([lexiqueScore, 16, situationsScore, videoScore, essayScore]);
      const expectedTier = expectedTotal === null ? null : computeTier(expectedTotal);

      expect(prisma.evaluationAttempt.update).toHaveBeenCalledWith({
        where: { id: "attempt-1" },
        data: {
          lexiqueScore,
          situationsScore,
          videoScore,
          essayScore,
          totalScore: expectedTotal,
          tier: expectedTier,
          status: "corrige",
          gradedAt: expect.any(Date),
        },
      });
    });
  });

  describe("gradeEssayResponse / gradePartieOuverte — validation et calcul", () => {
    it("gradeEssayResponse rejette un critère avec une valeur hors échelle", async () => {
      prisma.essayResponse.findUnique.mockResolvedValue({ id: "e-1", attemptId: "attempt-1" });
      const invalid = { ...maxEssayCriteria(), [ESSAY_GRADING_CRITERIA[0].key]: 999 };
      await expect(service.gradeEssayResponse("e-1", invalid)).rejects.toThrow(BadRequestException);
    });

    it("gradePartieOuverte rejette une note qui dépasse le maxPoints du critère", async () => {
      prisma.ecritOuvertResponse.findUnique.mockResolvedValue({ id: "eo-1", attemptId: "attempt-1" });
      const c = PARTIE_OUVERTE_GRADING_CRITERIA[0];
      const invalid = { ...maxPartieOuverteCriteria(), [c.key]: c.maxPoints + 0.5 };
      await expect(service.gradePartieOuverte("eo-1", invalid)).rejects.toThrow(BadRequestException);
    });

    it("gradePartieOuverte rejette un pas différent de 0,5", async () => {
      prisma.ecritOuvertResponse.findUnique.mockResolvedValue({ id: "eo-1", attemptId: "attempt-1" });
      const c = PARTIE_OUVERTE_GRADING_CRITERIA[0];
      const invalid = { ...maxPartieOuverteCriteria(), [c.key]: 0.2 };
      await expect(service.gradePartieOuverte("eo-1", invalid)).rejects.toThrow(BadRequestException);
    });
  });

  describe("notifyRh", () => {
    it("rejette si la tentative n'est pas encore 'corrige'", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue(baseAttempt({ status: "en_correction" }));
      await expect(service.notifyRh("attempt-1")).rejects.toThrow(BadRequestException);
      expect(email.send).not.toHaveBeenCalled();
    });

    it("n'envoie pas d'e-mail si RH_NOTIFICATION_EMAIL n'est pas configurée, mais marque quand même rhNotifiedAt", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue(
        baseAttempt({ status: "corrige", totalScore: 82, tier: "placement_direct" })
      );
      prisma.evaluationAttempt.update.mockResolvedValue({});

      await service.notifyRh("attempt-1");

      expect(email.send).not.toHaveBeenCalled();
      expect(prisma.evaluationAttempt.update).toHaveBeenCalledWith({
        where: { id: "attempt-1" },
        data: { rhNotifiedAt: expect.any(Date) },
      });
    });

    it("envoie un e-mail récapitulatif à la RH avec le libellé du tier quand la variable est configurée", async () => {
      process.env.RH_NOTIFICATION_EMAIL = "rh@example.com";
      prisma.evaluationAttempt.findUnique.mockResolvedValue(
        baseAttempt({ status: "corrige", totalScore: 82, tier: "placement_direct" })
      );
      prisma.evaluationAttempt.update.mockResolvedValue({});

      await service.notifyRh("attempt-1");

      expect(email.send).toHaveBeenCalledTimes(1);
      const args = email.send.mock.calls[0][0];
      expect(args.to).toBe("rh@example.com");
      expect(args.text).toContain(TIER_LABELS.placement_direct);
      expect(args.text).toContain("82");
      expect(args.text).toContain("Awa Diallo");
    });
  });

  describe("confirmPayment", () => {
    it("rejette si la tentative n'est pas en_attente_paiement", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue(baseAttempt({ status: "corrige" }));
      await expect(service.confirmPayment("attempt-1", { groupeId: "g-1" })).rejects.toThrow(
        BadRequestException
      );
    });

    it("lève NotFoundException si le groupe n'existe pas", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue(
        baseAttempt({ status: "en_attente_paiement" })
      );
      prisma.groupe.findUnique.mockResolvedValue(null);
      await expect(service.confirmPayment("attempt-1", { groupeId: "g-1" })).rejects.toThrow(
        NotFoundException
      );
    });

    it("génère le premier matricule ETF-2026-0001 quand aucun apprenant n'existe encore", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue(
        baseAttempt({ status: "en_attente_paiement" })
      );
      prisma.groupe.findUnique.mockResolvedValue({ id: "g-1", label: "Groupe A" });
      prisma.apprenant.findMany.mockResolvedValue([]);
      prisma.apprenant.create.mockResolvedValue({ id: "app-new" });
      prisma.evaluationAttempt.update.mockResolvedValue({});

      await service.confirmPayment("attempt-1", { groupeId: "g-1" });

      const createArgs = prisma.apprenant.create.mock.calls[0][0];
      expect(createArgs.data.matricule).toBe("ETF-2026-0001");
    });

    it("incrémente le matricule au-delà du plus grand existant, en ignorant les entrées malformées", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue(
        baseAttempt({ status: "en_attente_paiement" })
      );
      prisma.groupe.findUnique.mockResolvedValue({ id: "g-1", label: "Groupe A" });
      prisma.apprenant.findMany.mockResolvedValue([
        { matricule: "ETF-2026-0002" },
        { matricule: "ETF-2026-0007" },
        { matricule: "ETF-2026-XYZ" },
      ]);
      prisma.apprenant.create.mockResolvedValue({ id: "app-new" });
      prisma.evaluationAttempt.update.mockResolvedValue({});

      await service.confirmPayment("attempt-1", { groupeId: "g-1" });

      const createArgs = prisma.apprenant.create.mock.calls[0][0];
      expect(createArgs.data.matricule).toBe("ETF-2026-0008");
    });

    it("hache le mot de passe temporaire, met la tentative à jour et envoie les identifiants en clair par e-mail (une seule fois)", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue(
        baseAttempt({ status: "en_attente_paiement" })
      );
      prisma.groupe.findUnique.mockResolvedValue({ id: "g-1", label: "Groupe A" });
      prisma.apprenant.findMany.mockResolvedValue([]);
      prisma.apprenant.create.mockResolvedValue({ id: "app-new" });
      prisma.evaluationAttempt.update.mockResolvedValue({});

      await service.confirmPayment("attempt-1", { groupeId: "g-1" });

      const createArgs = prisma.apprenant.create.mock.calls[0][0];
      expect(createArgs.data.email).toBe(CANDIDAT.email);

      expect(email.send).toHaveBeenCalledTimes(1);
      const emailArgs = email.send.mock.calls[0][0];
      expect(emailArgs.to).toBe(CANDIDAT.email);
      expect(emailArgs.text).toContain(createArgs.data.matricule);

      const passwordMatch = /Mot de passe temporaire : (\S+)/.exec(emailArgs.text);
      expect(passwordMatch).not.toBeNull();
      const plaintextPassword = passwordMatch![1];
      expect(await bcrypt.compare(plaintextPassword, createArgs.data.password)).toBe(true);

      expect(prisma.evaluationAttempt.update).toHaveBeenCalledWith({
        where: { id: "attempt-1" },
        data: {
          apprenantId: "app-new",
          status: "active",
          paymentConfirmedAt: expect.any(Date),
        },
      });
    });
  });
});
