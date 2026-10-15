import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { OffresEntreprisesService, slugify } from "./offres-entreprises.service";
import { PrismaService } from "../prisma/prisma.service";

function delegate() {
  return {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

describe("OffresEntreprisesService", () => {
  let prisma: { lotEntreprise: ReturnType<typeof delegate>; missionEntreprise: ReturnType<typeof delegate> };
  let service: OffresEntreprisesService;

  beforeEach(() => {
    prisma = { lotEntreprise: delegate(), missionEntreprise: delegate() };
    service = new OffresEntreprisesService(prisma as unknown as PrismaService);
  });

  it("slugify retire accents, guillemets et espaces", () => {
    expect(slugify('Lot de 10 "Opérateurs & Support"')).toBe("lot-de-10-operateurs-support");
  });

  it("listPubliques ne renvoie que les éléments publiés, sans champs internes", async () => {
    prisma.lotEntreprise.findMany.mockResolvedValue([
      { id: "l1", nom: "Lot", publie: true, createdAt: new Date(), updatedAt: new Date(), ordre: 0 },
    ]);
    prisma.missionEntreprise.findMany.mockResolvedValue([]);
    const res = await service.listPubliques();
    expect(prisma.lotEntreprise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { publie: true } })
    );
    expect(res.lots[0]).toEqual({ id: "l1", nom: "Lot", ordre: 0 });
  });

  it("createLot génère un segment unique et place le lot en dernier", async () => {
    prisma.lotEntreprise.aggregate.mockResolvedValue({ _max: { ordre: 5 } });
    prisma.lotEntreprise.findUnique
      .mockResolvedValueOnce({ id: "x" }) // lot-closers déjà pris
      .mockResolvedValueOnce(null); // lot-closers-2 libre
    prisma.lotEntreprise.create.mockImplementation(({ data }) => Promise.resolve(data));
    const res = await service.createLot({
      nom: "Closers",
      mission: "m",
      dateFinFormation: "2026-12-01",
    });
    expect(res.segment).toBe("lot-closers-2");
    expect(res.ordre).toBe(6);
    expect(res.dateFinFormation).toEqual(new Date("2026-12-01"));
  });

  it("updateLot lève 404 si le lot n'existe pas", async () => {
    prisma.lotEntreprise.findUnique.mockResolvedValue(null);
    await expect(service.updateLot("nope", { nom: "x" })).rejects.toBeInstanceOf(NotFoundException);
  });

  it("updateLot convertit un segment en doublon en 409", async () => {
    prisma.lotEntreprise.findUnique.mockResolvedValue({ id: "l1" });
    prisma.lotEntreprise.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "x" })
    );
    await expect(service.updateLot("l1", { segment: "lot-setters" })).rejects.toBeInstanceOf(
      ConflictException
    );
  });

  it("removeMission supprime après vérification", async () => {
    prisma.missionEntreprise.findUnique.mockResolvedValue({ id: "m1" });
    await expect(service.removeMission("m1")).resolves.toEqual({ ok: true });
    expect(prisma.missionEntreprise.delete).toHaveBeenCalledWith({ where: { id: "m1" } });
  });
});
