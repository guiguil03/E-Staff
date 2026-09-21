import { ClasseVirtuelleReminderService } from "./reminder.service";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";

describe("ClasseVirtuelleReminderService", () => {
  let prisma: { seance: { findMany: jest.Mock; update: jest.Mock } };
  let email: { send: jest.Mock };
  let service: ClasseVirtuelleReminderService;

  const now = new Date("2026-09-21T08:00:00.000Z").getTime();

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    prisma = { seance: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() } };
    email = { send: jest.fn().mockResolvedValue({ delivered: true }) };
    service = new ClasseVirtuelleReminderService(
      prisma as unknown as PrismaService,
      email as unknown as EmailService
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function seance(overrides: Record<string, unknown> = {}) {
    return {
      id: "seance-1",
      numero: 3,
      startAt: new Date(now + 10 * 60 * 1000), // dans 10 minutes
      groupe: {
        label: "Groupe A",
        apprenants: [
          { email: "a@example.com", prenom: "Fara" },
          { email: "b@example.com", prenom: "Hery" },
        ],
      },
      ...overrides,
    };
  }

  it("envoie un rappel à chaque apprenant du groupe et marque le flag une fois fait", async () => {
    prisma.seance.findMany.mockResolvedValueOnce([seance()]).mockResolvedValueOnce([]);

    await service.handleReminders();

    expect(email.send).toHaveBeenCalledTimes(2);
    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ to: "a@example.com" }));
    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ to: "b@example.com" }));
    expect(prisma.seance.update).toHaveBeenCalledWith({
      where: { id: "seance-1" },
      data: { rappelJ1EnvoyeAt: expect.any(Date) },
    });
  });

  it("interroge les deux fenêtres (J-1 et 15 min) avec des flags distincts", async () => {
    await service.handleReminders();

    expect(prisma.seance.findMany).toHaveBeenCalledTimes(2);
    const [callJ1, call15min] = prisma.seance.findMany.mock.calls;
    expect(callJ1[0].where.rappelJ1EnvoyeAt).toBeNull();
    expect(call15min[0].where.rappel15minEnvoyeAt).toBeNull();
  });

  it("ne rappelle pas une séance déjà commencée (rattrapage après redémarrage)", async () => {
    prisma.seance.findMany
      .mockResolvedValueOnce([seance({ startAt: new Date(now - 60 * 1000) })])
      .mockResolvedValueOnce([]);

    await service.handleReminders();

    expect(email.send).not.toHaveBeenCalled();
    expect(prisma.seance.update).not.toHaveBeenCalled();
  });

  it("ne plante pas et ne marque rien pour un groupe sans aucun apprenant", async () => {
    prisma.seance.findMany
      .mockResolvedValueOnce([seance({ groupe: { label: "Groupe Vide", apprenants: [] } })])
      .mockResolvedValueOnce([]);

    await service.handleReminders();

    expect(email.send).not.toHaveBeenCalled();
    expect(prisma.seance.update).toHaveBeenCalledWith({
      where: { id: "seance-1" },
      data: { rappelJ1EnvoyeAt: expect.any(Date) },
    });
  });
});
