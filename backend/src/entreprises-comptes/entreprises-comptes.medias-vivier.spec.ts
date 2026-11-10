/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { EntreprisesComptesService } from "./entreprises-comptes.service";

// Médias d'un profil du vivier (CV, vidéo, audios) : uniquement pour un profil
// réellement présenté à l'entreprise, et uniquement ses propres fichiers.

const entreprise = { id: "e1", matricule: "ETF-ENT-1", raisonSociale: "Acme" };

function build(over: Record<string, any> = {}) {
  const getObjectStream = jest.fn().mockResolvedValue({ stream: "S", contentType: "audio/webm" });
  const prisma: Record<string, any> = {
    entreprise: { findUnique: jest.fn().mockResolvedValue(entreprise) },
    agent: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn() },
    apprenant: {
      findMany: jest.fn().mockResolvedValue([
        { id: "ap1", evaluationAttempt: { tier: "niveau_c1", totalScore: 80 } },
      ]),
      findUnique: jest.fn().mockResolvedValue({
        evaluationAttempt: { id: "att1", candidat: { cvKey: "cv/1.pdf", videoPresentationKey: null } },
      }),
    },
    situationResponse: {
      findMany: jest.fn().mockResolvedValue([{ id: "r1", situationIndex: 1, audioUrl: "SECRET" }]),
      findFirst: jest.fn(({ where }: any) => Promise.resolve(where.id === "r1" && where.attemptId === "att1" ? { audioUrl: "a/1.webm" } : null)),
    },
    ...over,
  };
  const service = new EntreprisesComptesService(prisma as never, {} as never, { getObjectStream } as never, {} as never, {} as never);
  return { service, getObjectStream };
}

describe("EntreprisesComptesService — médias du vivier", () => {
  it("liste les médias disponibles sans exposer les clés de stockage", async () => {
    const { service } = build();
    const r = await service.listMediasVivier("ETF-ENT-1", "apprenant", "ap1");
    expect(r).toEqual({ cvDisponible: true, videoDisponible: false, audios: [{ id: "r1", situationIndex: 1 }] });
    expect(JSON.stringify(r)).not.toContain("SECRET");
  });

  it("refuse un profil qui n'est pas dans le vivier présenté", async () => {
    const { service } = build();
    await expect(service.listMediasVivier("ETF-ENT-1", "apprenant", "autre")).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getCvVivierStream("ETF-ENT-1", "apprenant", "autre")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("refuse un type de profil invalide", async () => {
    const { service } = build();
    await expect(service.listMediasVivier("ETF-ENT-1", "formateur", "x")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("sert le CV depuis la clé du candidat", async () => {
    const { service, getObjectStream } = build();
    await service.getCvVivierStream("ETF-ENT-1", "apprenant", "ap1");
    expect(getObjectStream).toHaveBeenCalledWith("cv/1.pdf");
  });

  it("refuse la vidéo quand elle n'existe pas", async () => {
    const { service } = build();
    await expect(service.getVideoVivierStream("ETF-ENT-1", "apprenant", "ap1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("n'autorise l'audio que s'il appartient à la tentative de CE profil", async () => {
    const { service, getObjectStream } = build();
    await service.getAudioVivierStream("ETF-ENT-1", "apprenant", "ap1", "r1");
    expect(getObjectStream).toHaveBeenCalledWith("a/1.webm");
    await expect(service.getAudioVivierStream("ETF-ENT-1", "apprenant", "ap1", "r-autre-profil")).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
