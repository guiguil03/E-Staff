import { BadRequestException } from "@nestjs/common";
import { ClasseVirtuelleService } from "./classe-virtuelle.service";
import { PrismaService } from "../prisma/prisma.service";
import { DailyService } from "./daily.service";
import { EmailService } from "../common/email.service";

function makePrismaMock() {
  return {
    groupe: { findUnique: jest.fn() },
    seance: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), upsert: jest.fn() },
  };
}

function makeDailyMock() {
  return {
    createRoom: jest.fn().mockResolvedValue({ configured: false }),
    deleteRoom: jest.fn(),
    mintMeetingToken: jest.fn(),
  };
}

function makeEmailMock() {
  return { send: jest.fn() };
}

const GROUPE_A = { id: "groupe-a", cle: "A", label: "Groupe A", formateurId: "form-hasina" };
const GROUPE_B = { id: "groupe-b", cle: "B", label: "Groupe B", formateurId: "form-autre" };

const SEANCE_A3 = {
  id: "seance-a3",
  groupeId: "groupe-a",
  numero: 3,
  startAt: null,
  dureeMinutes: 90,
  objectifs: null,
  dailyRoomName: null,
  dailyRoomUrl: null,
};

describe("ClasseVirtuelleService.upsertSeance — conflit d'horaire", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let daily: ReturnType<typeof makeDailyMock>;
  let email: ReturnType<typeof makeEmailMock>;
  let service: ClasseVirtuelleService;

  beforeEach(() => {
    prisma = makePrismaMock();
    daily = makeDailyMock();
    email = makeEmailMock();
    service = new ClasseVirtuelleService(
      prisma as unknown as PrismaService,
      daily as unknown as DailyService,
      email as unknown as EmailService
    );
  });

  // Bug relevé le 2026-09-17 (formateur Hasina, groupe B) : planifier une
  // classe virtuelle pour un groupe échouait dès qu'un AUTRE groupe, avec un
  // formateur différent, avait déjà une séance sur ce créneau — la
  // vérification comparait à tort contre toutes les séances tous groupes
  // confondus au lieu de se limiter au même formateur.
  it("n'empêche pas de planifier si le chevauchement concerne un groupe avec un AUTRE formateur", async () => {
    prisma.groupe.findUnique.mockResolvedValue(GROUPE_A);
    prisma.seance.upsert.mockResolvedValue(SEANCE_A3);
    // La séance en conflit potentiel appartient au groupe B (formateur différent) :
    // ne doit jamais être renvoyée puisque la requête filtre par formateurId.
    prisma.seance.findMany.mockResolvedValue([]);
    prisma.seance.update.mockResolvedValue({ ...SEANCE_A3, startAt: new Date(Date.now() + 3600_000) });

    await expect(
      service.upsertSeance("A", 3, { startAt: new Date(Date.now() + 3600_000).toISOString() })
    ).resolves.toBeDefined();

    // La recherche de conflit doit être filtrée sur le formateur du groupe courant.
    expect(prisma.seance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ groupe: { formateurId: "form-hasina" } }),
      })
    );
  });

  it("bloque le chevauchement avec une autre séance du MÊME formateur (groupe différent)", async () => {
    const startAt = new Date(Date.now() + 3600_000);
    prisma.groupe.findUnique.mockResolvedValue(GROUPE_A);
    prisma.seance.upsert.mockResolvedValue(SEANCE_A3);
    prisma.seance.findMany.mockResolvedValue([
      {
        id: "seance-c5",
        numero: 5,
        startAt,
        dureeMinutes: 90,
        groupe: { label: "Groupe C" },
      },
    ]);

    await expect(
      service.upsertSeance("A", 3, { startAt: startAt.toISOString() })
    ).rejects.toThrow(BadRequestException);
  });

  it("ne bloque rien si le groupe n'a pas encore de formateur assigné (rien à vérifier)", async () => {
    prisma.groupe.findUnique.mockResolvedValue({ ...GROUPE_B, formateurId: null });
    prisma.seance.upsert.mockResolvedValue({ ...SEANCE_A3, groupeId: "groupe-b" });
    prisma.seance.update.mockResolvedValue({
      ...SEANCE_A3,
      groupeId: "groupe-b",
      startAt: new Date(Date.now() + 3600_000),
    });

    await expect(
      service.upsertSeance("B", 3, { startAt: new Date(Date.now() + 3600_000).toISOString() })
    ).resolves.toBeDefined();

    expect(prisma.seance.findMany).not.toHaveBeenCalled();
  });

  // Bug relevé le 2026-09-18 (groupe A) : "Séance n°1 introuvable pour le
  // groupe A" alors que le groupe existe bien — les 12 créneaux d'un groupe
  // ne sont créés que par le seed (prisma/seed.ts), jamais garanti en prod.
  // Planifier doit pouvoir créer le créneau à la volée plutôt que d'exiger
  // qu'il ait déjà été seedé.
  it("crée la séance à la volée si elle n'existe pas encore pour ce groupe/numéro", async () => {
    const startAt = new Date(Date.now() + 3600_000);
    prisma.groupe.findUnique.mockResolvedValue(GROUPE_A);
    prisma.seance.upsert.mockResolvedValue({ ...SEANCE_A3, numero: 1 });
    prisma.seance.findMany.mockResolvedValue([]);
    prisma.seance.update.mockResolvedValue({ ...SEANCE_A3, numero: 1, startAt });

    await expect(
      service.upsertSeance("A", 1, { startAt: startAt.toISOString() })
    ).resolves.toBeDefined();

    expect(prisma.seance.upsert).toHaveBeenCalledWith({
      where: { groupeId_numero: { groupeId: "groupe-a", numero: 1 } },
      update: {},
      create: { groupeId: "groupe-a", numero: 1 },
    });
  });
});
