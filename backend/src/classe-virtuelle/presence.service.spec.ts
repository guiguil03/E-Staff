import { PresenceService } from "./presence.service";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";

function makePrismaMock() {
  return {
    seance: { findUnique: jest.fn() },
    apprenant: { findUnique: jest.fn() },
    formateur: { findUnique: jest.fn() },
    presence: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn(), count: jest.fn(), create: jest.fn() },
  };
}

const SEANCE = {
  id: "seance-1",
  numero: 3,
  groupe: {
    label: "Groupe A",
    apprenants: [
      { prenom: "Awa", email: "awa@example.com" },
      { prenom: "Njaka", email: "njaka@example.com" },
    ],
  },
};

describe("PresenceService", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let email: { send: jest.Mock };
  let service: PresenceService;

  beforeEach(() => {
    prisma = makePrismaMock();
    email = { send: jest.fn().mockResolvedValue({ delivered: true }) };
    service = new PresenceService(
      prisma as unknown as PrismaService,
      email as unknown as EmailService
    );
  });

  describe("recordJoin", () => {
    it("ignore silencieusement une salle inconnue", async () => {
      prisma.seance.findUnique.mockResolvedValue(null);
      await service.recordJoin({ room: "salle-inconnue", session_id: "s-1" });
      expect(prisma.presence.upsert).not.toHaveBeenCalled();
      expect(email.send).not.toHaveBeenCalled();
    });

    it("prévient tous les apprenants du groupe quand le formateur est le premier à rejoindre", async () => {
      prisma.seance.findUnique.mockResolvedValue(SEANCE);
      prisma.formateur.findUnique.mockResolvedValue({ id: "form-1" });
      prisma.presence.count.mockResolvedValue(0); // aucun formateur déjà connecté

      await service.recordJoin({ room: "seance-1", user_id: "form-1", session_id: "s-1" });

      expect(email.send).toHaveBeenCalledTimes(2);
      const recipients = email.send.mock.calls.map((c) => c[0].to);
      expect(recipients).toEqual(["awa@example.com", "njaka@example.com"]);
      expect(email.send.mock.calls[0][0].text).toContain("Groupe A");
    });

    it("ne renvoie pas l'e-mail si le formateur se reconnecte (déjà une présence formateur enregistrée)", async () => {
      prisma.seance.findUnique.mockResolvedValue(SEANCE);
      prisma.formateur.findUnique.mockResolvedValue({ id: "form-1" });
      prisma.presence.count.mockResolvedValue(1); // déjà connecté une première fois

      await service.recordJoin({ room: "seance-1", user_id: "form-1", session_id: "s-2" });

      expect(email.send).not.toHaveBeenCalled();
    });

    it("n'envoie rien quand c'est un apprenant qui rejoint", async () => {
      prisma.seance.findUnique.mockResolvedValue(SEANCE);
      prisma.apprenant.findUnique.mockResolvedValue({ id: "app-1" });

      await service.recordJoin({ room: "seance-1", user_id: "app-1", session_id: "s-3" });

      expect(prisma.presence.count).not.toHaveBeenCalled();
      expect(email.send).not.toHaveBeenCalled();
    });
  });
});
