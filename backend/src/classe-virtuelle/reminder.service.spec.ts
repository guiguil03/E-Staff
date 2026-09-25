import { ClasseVirtuelleReminderService, jourRelatif } from "./reminder.service";
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

  it("ne marque pas le flag si un envoi a réellement échoué — retenté au prochain cron", async () => {
    prisma.seance.findMany.mockResolvedValueOnce([seance()]).mockResolvedValueOnce([]);
    email.send
      .mockResolvedValueOnce({ delivered: true })
      .mockResolvedValueOnce({ delivered: false, reason: "network-error" });

    await service.handleReminders();

    expect(prisma.seance.update).not.toHaveBeenCalled();
  });

  it("marque quand même le flag si le seul échec est le mode stub (pas de clé API configurée)", async () => {
    prisma.seance.findMany.mockResolvedValueOnce([seance()]).mockResolvedValueOnce([]);
    email.send.mockResolvedValue({ delivered: false, reason: "no-provider-configured" });

    await service.handleReminders();

    expect(prisma.seance.update).toHaveBeenCalledWith({
      where: { id: "seance-1" },
      data: { rappelJ1EnvoyeAt: expect.any(Date) },
    });
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

  it("dit « aujourd'hui » (et pas « demain ») pour une séance planifiée le jour même", async () => {
    // now = 2026-09-21 11:00 à Madagascar ; séance à 16:15 le même jour.
    prisma.seance.findMany
      .mockResolvedValueOnce([seance({ startAt: new Date("2026-09-21T13:15:00.000Z") })])
      .mockResolvedValueOnce([]);

    await service.handleReminders();

    const mail = email.send.mock.calls[0][0];
    expect(mail.subject).toBe("Rappel — votre séance d'aujourd'hui (Groupe A)");
    expect(mail.text).toContain("a lieu aujourd'hui");
    expect(mail.text).not.toContain("demain");
    expect(mail.html).not.toContain("demain");
  });

  it("dit « demain » pour une séance du lendemain", async () => {
    prisma.seance.findMany
      .mockResolvedValueOnce([seance({ startAt: new Date("2026-09-22T06:00:00.000Z") })])
      .mockResolvedValueOnce([]);

    await service.handleReminders();

    const mail = email.send.mock.calls[0][0];
    expect(mail.subject).toBe("Rappel — votre séance de demain (Groupe A)");
    expect(mail.text).toContain("a lieu demain");
  });
});

describe("jourRelatif", () => {
  it("se base sur le jour calendaire à Madagascar, pas sur l'écart de 24h", () => {
    // 23:30 à Madagascar (20:30 UTC) -> séance le lendemain à 00:30 : "demain".
    const now = new Date("2026-09-21T20:30:00.000Z");
    expect(jourRelatif(new Date("2026-09-21T21:30:00.000Z"), now).libelle).toBe("demain");
    expect(jourRelatif(new Date("2026-09-21T20:45:00.000Z"), now).libelle).toBe("aujourd'hui");
  });
});
