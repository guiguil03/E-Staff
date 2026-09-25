import { BadRequestException, NotFoundException } from "@nestjs/common";
import { OffresEmploiService } from "./offres-emploi.service";
import { PrismaService } from "../prisma/prisma.service";

const NOW = new Date("2026-09-25T10:00:00.000Z");

function offre(overrides: Record<string, unknown> = {}) {
  return {
    id: "o-1",
    metierSlug: "setter",
    titre: "Téléprospecteur PAC",
    drapeau: "🇨🇦",
    modalites: ["Télétravail"],
    projet: null,
    remuneration: null,
    prerequis: null,
    placesTotal: 10,
    placesPourvues: 7,
    dateLimite: null,
    cloturee: false,
    publiee: true,
    lienWhatsapp: null,
    createdAt: new Date("2026-09-20"),
    updatedAt: new Date("2026-09-21"),
    ...overrides,
  };
}

describe("OffresEmploiService", () => {
  let prisma: {
    offreEmploi: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: OffresEmploiService;

  beforeEach(() => {
    prisma = {
      offreEmploi: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new OffresEmploiService(prisma as unknown as PrismaService);
  });

  describe("listPubliques", () => {
    it("ne lit que les offres publiées, ajoute le statut et masque les champs internes", async () => {
      prisma.offreEmploi.findMany.mockResolvedValue([offre()]);

      const [o] = await service.listPubliques(NOW);

      expect(prisma.offreEmploi.findMany).toHaveBeenCalledWith({ where: { publiee: true } });
      expect(o).toEqual(expect.objectContaining({ id: "o-1", statut: "ouvert", placesRestantes: 3, tauxRemplissage: 70 }));
      expect(o).not.toHaveProperty("publiee");
      expect(o).not.toHaveProperty("updatedAt");
    });

    it("trie : ouvertes, puis dernières places, puis clôturées", async () => {
      prisma.offreEmploi.findMany.mockResolvedValue([
        offre({ id: "complete", placesPourvues: 10 }),
        offre({ id: "presque", placesPourvues: 9 }),
        offre({ id: "ouverte", placesPourvues: 2 }),
      ]);

      const result = await service.listPubliques(NOW);

      expect(result.map((o) => o.id)).toEqual(["ouverte", "presque", "complete"]);
    });
  });

  describe("create / update", () => {
    it("refuse plus de places pourvues que de places totales", async () => {
      await expect(
        service.create({ metierSlug: "setter", titre: "X", placesTotal: 5, placesPourvues: 6 })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.offreEmploi.create).not.toHaveBeenCalled();
    });

    it("nettoie les modalités vides et convertit la date limite", async () => {
      prisma.offreEmploi.create.mockImplementation(({ data }) => Promise.resolve(offre(data)));

      await service.create({
        metierSlug: "setter",
        titre: "X",
        placesTotal: 5,
        modalites: [" Télétravail ", ""],
        dateLimite: "2026-10-01T00:00:00.000Z",
        lienWhatsapp: "",
      });

      const data = prisma.offreEmploi.create.mock.calls[0][0].data;
      expect(data.modalites).toEqual(["Télétravail"]);
      expect(data.dateLimite).toEqual(new Date("2026-10-01T00:00:00.000Z"));
      expect(data.lienWhatsapp).toBeNull();
    });

    it("vérifie les places contre les valeurs existantes lors d'une mise à jour partielle", async () => {
      prisma.offreEmploi.findUnique.mockResolvedValue(offre({ placesTotal: 10 }));
      await expect(service.update("o-1", { placesPourvues: 11 })).rejects.toThrow(BadRequestException);
    });

    it("lève NotFoundException pour une offre inconnue", async () => {
      prisma.offreEmploi.findUnique.mockResolvedValue(null);
      await expect(service.update("x", { titre: "Y" })).rejects.toThrow(NotFoundException);
    });
  });

  describe("verifierCandidature", () => {
    it("accepte une offre ouverte", async () => {
      prisma.offreEmploi.findUnique.mockResolvedValue(offre());
      await expect(service.verifierCandidature("o-1", false)).resolves.toBeDefined();
    });

    it("refuse une offre complète, sauf en liste d'attente", async () => {
      prisma.offreEmploi.findUnique.mockResolvedValue(offre({ placesPourvues: 10 }));
      await expect(service.verifierCandidature("o-1", false)).rejects.toThrow(BadRequestException);
      await expect(service.verifierCandidature("o-1", true)).resolves.toBeDefined();
    });

    it("refuse une offre non publiée ou supprimée", async () => {
      prisma.offreEmploi.findUnique.mockResolvedValue(offre({ publiee: false }));
      await expect(service.verifierCandidature("o-1", true)).rejects.toThrow(BadRequestException);
      prisma.offreEmploi.findUnique.mockResolvedValue(null);
      await expect(service.verifierCandidature("o-1", true)).rejects.toThrow(BadRequestException);
    });
  });
});
