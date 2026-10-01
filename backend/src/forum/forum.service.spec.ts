import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ForumService } from "./forum.service";
import { PrismaService } from "../prisma/prisma.service";
import { DailyService } from "../classe-virtuelle/daily.service";

// Couvre en particulier getLiveRoom(isAdmin) — voir le fix de sécurité du
// 2026-09-21 (audit) : l'hôte du Live est désormais déterminé par la
// session signée du contrôleur, pas par un header client auto-déclaré.
// Cette suite fige le comportement du service pour qu'une régression sur
// ce point (ex. un futur refactor qui repasserait par un flag non vérifié)
// se voie immédiatement.

function makePrismaMock() {
  return {
    forumLive: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  };
}

describe("ForumService", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let daily: { createRoom: jest.Mock; mintMeetingToken: jest.Mock };
  let service: ForumService;

  const now = new Date("2026-09-21T10:00:00.000Z").getTime();

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    prisma = makePrismaMock();
    daily = { createRoom: jest.fn(), mintMeetingToken: jest.fn() };
    service = new ForumService(prisma as unknown as PrismaService, daily as unknown as DailyService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function liveEnCours(overrides: Record<string, unknown> = {}) {
    return {
      id: "live-1",
      titre: "Le Live du mois",
      invite: "Invité surprise",
      description: null,
      startAt: new Date(now - 5 * 60 * 1000), // commencé il y a 5 min
      dureeMinutes: 60,
      dailyRoomName: "room-live-1",
      dailyRoomUrl: "https://daily.example/room-live-1",
      ...overrides,
    };
  }

  describe("getLiveRoom", () => {
    it("renvoie null s'il n'y a aucun live à venir ou en cours", async () => {
      prisma.forumLive.findMany.mockResolvedValue([]);
      const result = await service.getLiveRoom(false);
      expect(result).toBeNull();
    });

    it("frappe un jeton spectateur (isOwner: false) pour un appelant non admin", async () => {
      prisma.forumLive.findMany.mockResolvedValue([liveEnCours()]);
      daily.mintMeetingToken.mockResolvedValue("token-spectateur");

      const result = await service.getLiveRoom(false);

      expect(daily.mintMeetingToken).toHaveBeenCalledWith(
        expect.objectContaining({ isOwner: false, userName: "Spectateur" })
      );
      expect(result?.roomUrl).toBe("https://daily.example/room-live-1?t=token-spectateur");
    });

    it("frappe un jeton hôte (isOwner: true) seulement quand isAdmin est vrai", async () => {
      prisma.forumLive.findMany.mockResolvedValue([liveEnCours()]);
      daily.mintMeetingToken.mockResolvedValue("token-hote");

      const result = await service.getLiveRoom(true);

      expect(daily.mintMeetingToken).toHaveBeenCalledWith(
        expect.objectContaining({ isOwner: true, userId: "admin", userName: "Administration e-Staf" })
      );
      expect(result?.roomUrl).toBe("https://daily.example/room-live-1?t=token-hote");
    });

    it("ne renvoie pas d'URL de salle en dehors de la fenêtre de connexion", async () => {
      prisma.forumLive.findMany.mockResolvedValue([
        liveEnCours({ startAt: new Date(now + 60 * 60 * 1000) }), // dans 1h, fenêtre 10 min avant
      ]);

      const result = await service.getLiveRoom(true);

      expect(result?.withinJoinWindow).toBe(false);
      expect(result?.roomUrl).toBeNull();
      expect(daily.mintMeetingToken).not.toHaveBeenCalled();
    });

    it("signale configured=false quand DAILY_API_KEY n'est pas renseignée", async () => {
      const original = process.env.DAILY_API_KEY;
      delete process.env.DAILY_API_KEY;
      prisma.forumLive.findMany.mockResolvedValue([liveEnCours()]);
      daily.mintMeetingToken.mockResolvedValue(null);

      const result = await service.getLiveRoom(false);

      expect(result?.configured).toBe(false);
      if (original !== undefined) process.env.DAILY_API_KEY = original;
    });
  });

  describe("getProchainLive", () => {
    it("ignore un live déjà terminé au profit du prochain à venir", async () => {
      prisma.forumLive.findMany.mockResolvedValue([
        liveEnCours({ id: "passe", startAt: new Date(now - 5 * 60 * 60 * 1000), dureeMinutes: 60 }),
        liveEnCours({ id: "futur", startAt: new Date(now + 24 * 60 * 60 * 1000) }),
      ]);

      const result = await service.getProchainLive();

      expect(result?.id).toBe("futur");
    });

    it("renvoie null quand aucun live n'a d'horaire programmé", async () => {
      prisma.forumLive.findMany.mockResolvedValue([]);
      expect(await service.getProchainLive()).toBeNull();
    });
  });

  describe("createLive", () => {
    it("refuse un live sans titre ni invité", async () => {
      await expect(service.createLive({ titre: "", invite: "" } as never)).rejects.toThrow(
        BadRequestException
      );
      expect(prisma.forumLive.create).not.toHaveBeenCalled();
    });

    it("ne crée pas de salle Daily tant qu'aucun horaire n'est renseigné", async () => {
      const created = { id: "live-2", startAt: null, dailyRoomName: null };
      prisma.forumLive.create.mockResolvedValue(created);
      prisma.forumLive.findUnique.mockResolvedValue(created);

      await service.createLive({ titre: "Live", invite: "Invité" } as never);

      expect(daily.createRoom).not.toHaveBeenCalled();
    });
  });

  describe("updateLive", () => {
    it("lève NotFoundException si le live n'existe pas", async () => {
      prisma.forumLive.findUnique.mockResolvedValue(null);
      await expect(service.updateLive("inconnu", {} as never)).rejects.toThrow(NotFoundException);
    });
  });
});
