import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { EnregistrementService } from "./enregistrement.service";
import { PrismaService } from "../prisma/prisma.service";
import { DailyService } from "./daily.service";

describe("EnregistrementService", () => {
  let prisma: {
    seance: { findUnique: jest.Mock };
    enregistrement: { upsert: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
    apprenant: { findUnique: jest.Mock };
    groupe: { findUnique: jest.Mock };
    formateur: { findUnique: jest.Mock };
  };
  let daily: { getRecordingAccessLink: jest.Mock; deleteRecording: jest.Mock };
  let service: EnregistrementService;

  beforeEach(() => {
    prisma = {
      seance: { findUnique: jest.fn() },
      enregistrement: { upsert: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
      apprenant: { findUnique: jest.fn() },
      groupe: { findUnique: jest.fn() },
      formateur: { findUnique: jest.fn() },
    };
    daily = {
      getRecordingAccessLink: jest.fn().mockResolvedValue({ url: "https://daily/rec.mp4", expires: 1 }),
      deleteRecording: jest.fn().mockResolvedValue(true),
    };
    service = new EnregistrementService(prisma as unknown as PrismaService, daily as unknown as DailyService);
  });

  it("rattache un enregistrement prêt à la séance (nom de salle = id de séance), de façon idempotente", async () => {
    prisma.seance.findUnique.mockResolvedValue({ id: "seance-1" });

    await service.enregistrerPret({ recording_id: "rec-1", room_name: "seance-1", start_ts: 1700000000, duration: 3600.4 });

    expect(prisma.enregistrement.upsert).toHaveBeenCalledWith({
      where: { dailyRecordingId: "rec-1" },
      update: {},
      create: {
        seanceId: "seance-1",
        dailyRecordingId: "rec-1",
        dureeSecondes: 3600,
        debutAt: new Date(1700000000 * 1000),
      },
    });
  });

  it("ignore un enregistrement d'une salle sans séance (ex. Live du Forum)", async () => {
    prisma.seance.findUnique.mockResolvedValue(null);
    await service.enregistrerPret({ recording_id: "rec-2", room_name: "live-1" });
    expect(prisma.enregistrement.upsert).not.toHaveBeenCalled();
  });

  it("donne le lien à un apprenant du groupe de la séance", async () => {
    prisma.apprenant.findUnique.mockResolvedValue({ groupeId: "g-A" });
    prisma.enregistrement.findUnique.mockResolvedValue({ dailyRecordingId: "rec-1", seance: { groupeId: "g-A" } });

    await expect(service.lienPourApprenant("ETF-2026-0001", "e-1")).resolves.toEqual({
      url: "https://daily/rec.mp4",
      expires: 1,
    });
  });

  it("refuse le lien à un apprenant d'un autre groupe", async () => {
    prisma.apprenant.findUnique.mockResolvedValue({ groupeId: "g-B" });
    prisma.enregistrement.findUnique.mockResolvedValue({ dailyRecordingId: "rec-1", seance: { groupeId: "g-A" } });

    await expect(service.lienPourApprenant("ETF-2026-0006", "e-1")).rejects.toThrow(NotFoundException);
    expect(daily.getRecordingAccessLink).not.toHaveBeenCalled();
  });

  it("refuse la liste à un formateur qui n'encadre pas le groupe", async () => {
    prisma.groupe.findUnique.mockResolvedValue({ id: "g-A", formateurId: "f-1" });
    prisma.formateur.findUnique.mockResolvedValue({ id: "f-2" });
    await expect(service.listPourFormateur("A", 3, "ETF-FORM-2026-0002")).rejects.toThrow(ForbiddenException);
  });

  it("purge les enregistrements de plus de 90 jours, et ne garde en base que ceux dont la suppression Daily a échoué", async () => {
    const maintenant = new Date("2026-12-31T00:00:00Z");
    prisma.enregistrement.findMany.mockResolvedValue([
      { id: "e-1", dailyRecordingId: "rec-1" },
      { id: "e-2", dailyRecordingId: "rec-2" },
    ]);
    daily.deleteRecording.mockImplementation(async (id: string) => id === "rec-1");

    await expect(service.purgerAnciens(maintenant)).resolves.toEqual({ supprimes: 1, total: 2 });

    expect(prisma.enregistrement.findMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: new Date("2026-10-02T00:00:00Z") } },
      select: { id: true, dailyRecordingId: true },
    });
    expect(prisma.enregistrement.delete).toHaveBeenCalledTimes(1);
    expect(prisma.enregistrement.delete).toHaveBeenCalledWith({ where: { id: "e-1" } });
  });
});
