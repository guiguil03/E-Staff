import { BadRequestException, NotFoundException } from "@nestjs/common";
import { EntreprisesComptesService } from "./entreprises-comptes.service";

// Salle d'entretien : choix d'un profil du vivier, accès à la salle (entreprise
// et RH), liste sans fuite d'URL brute ni d'identité.

const entreprise = { id: "e1", matricule: "ETF-ENT-1", raisonSociale: "Acme" };

/* eslint-disable @typescript-eslint/no-explicit-any */
function build(prismaOverrides: Record<string, unknown> = {}) {
  const daily = {
    createRoom: jest.fn().mockResolvedValue({ configured: true, roomName: "entretien-x", roomUrl: "https://daily/x" }),
    mintMeetingToken: jest.fn().mockResolvedValue("tok"),
  };
  const email = { send: jest.fn().mockResolvedValue(undefined) };
  const prisma: Record<string, any> = {
    entreprise: { findUnique: jest.fn().mockResolvedValue(entreprise) },
    ...prismaOverrides,
  };
  const service = new EntreprisesComptesService(prisma as never, email as never, {} as never, daily as never, {} as never);
  return { service, prisma, daily, email };
}

describe("EntreprisesComptesService — entretiens", () => {
  it("listEntretiens n'expose ni l'URL brute de la salle ni l'identité du candidat", async () => {
    const { service } = build({
      entretienVirtuel: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "t1",
            titre: "Entretien",
            startAt: null,
            dureeMinutes: 30,
            createdAt: new Date(),
            dailyRoomName: "r",
            dailyRoomUrl: "https://daily/secret",
            interetVivier: { agentId: null, apprenantId: "ap1" },
          },
        ]),
      },
    });
    const [e] = await service.listEntretiens("ETF-ENT-1");
    expect(e).not.toHaveProperty("dailyRoomUrl");
    expect(e.salleDisponible).toBe(true);
    expect(e.profilLabel).toMatch(/^Profil AP-[0-9A-F]{6}$/);
  });

  it("rejoindreEntretien refuse un entretien d'une autre entreprise", async () => {
    const { service } = build({
      entretienVirtuel: { findFirst: jest.fn().mockResolvedValue(null) },
    });
    await expect(service.rejoindreEntretien("ETF-ENT-1", "autre")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejoindreEntretien refuse si la salle n'existe pas", async () => {
    const { service } = build({
      entretienVirtuel: {
        findFirst: jest.fn().mockResolvedValue({ id: "t1", dailyRoomName: null, dailyRoomUrl: null }),
      },
    });
    await expect(service.rejoindreEntretien("ETF-ENT-1", "t1")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejoindreEntretien renvoie un lien nominatif (jeton) vers la salle existante", async () => {
    const { service, daily } = build({
      entretienVirtuel: {
        findFirst: jest.fn().mockResolvedValue({ id: "t1", dailyRoomName: "r", dailyRoomUrl: "https://daily/r" }),
      },
    });
    const r = await service.rejoindreEntretien("ETF-ENT-1", "t1");
    expect(r).toEqual({ configured: true, url: "https://daily/r?t=tok" });
    expect(daily.createRoom).not.toHaveBeenCalled();
    expect(daily.mintMeetingToken).toHaveBeenCalledWith(expect.objectContaining({ roomName: "r", isOwner: true }));
  });

  it("planifierEntretien refuse un profil hors du vivier présenté à l'entreprise", async () => {
    const { service } = build({
      agent: { findMany: jest.fn().mockResolvedValue([]) },
      apprenant: { findMany: jest.fn().mockResolvedValue([]) },
    });
    await expect(
      service.planifierEntretien("ETF-ENT-1", { titre: "x", profilRef: "apprenant:inconnu" })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("planifierEntretien réutilise l'intérêt existant et envoie l'invitation à l'e-mail réel du profil", async () => {
    const interet = { id: "i1", agent: null, apprenant: { email: "rado@x.mg", prenom: "Rado" } };
    const { service, email, prisma } = build({
      agent: { findMany: jest.fn().mockResolvedValue([]) },
      apprenant: {
        findMany: jest.fn().mockResolvedValue([
          { id: "ap1", evaluationAttempt: { tier: "niveau_c1", totalScore: 80 } },
        ]),
      },
      interetVivier: {
        // 1er appel : intérêt existant du profil ; 2e : relecture avec la personne.
        findFirst: jest.fn().mockResolvedValueOnce({ id: "i1" }).mockResolvedValueOnce(interet),
        create: jest.fn(),
      },
      entretienVirtuel: {
        create: jest.fn().mockResolvedValue({ id: "t1" }),
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({ dailyRoomName: "entretien-t1", dailyRoomUrl: "https://daily/x" }),
      },
    });
    const r = await service.planifierEntretien("ETF-ENT-1", { titre: "Entretien", profilRef: "apprenant:ap1" });
    expect(prisma.interetVivier.create).not.toHaveBeenCalled();
    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ to: "rado@x.mg" }));
    expect(r.emailEnvoye).toBe(true);
  });
});
