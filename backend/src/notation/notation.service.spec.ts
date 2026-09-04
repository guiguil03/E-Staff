import { NotFoundException } from "@nestjs/common";
import { NotationService } from "./notation.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage.service";

function makePrismaMock() {
  return {
    groupe: { findUnique: jest.fn() },
    seance: { findUnique: jest.fn(), findMany: jest.fn() },
    apprenant: { findUnique: jest.fn() },
    notation: { findUnique: jest.fn(), findMany: jest.fn(), upsert: jest.fn() },
  };
}

function makeStorageMock() {
  return { uploadBuffer: jest.fn(), getObjectStream: jest.fn() };
}

const GROUPE = { id: "groupe-1", cle: "A", label: "Groupe A" };
const SEANCE = { id: "seance-1", groupeId: "groupe-1", numero: 3, startAt: new Date("2026-01-01") };
const APPRENANT = { id: "app-1", matricule: "ETF-2026-0001", prenom: "Awa", nom: "Diallo" };

describe("NotationService", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let storage: ReturnType<typeof makeStorageMock>;
  let service: NotationService;

  beforeEach(() => {
    prisma = makePrismaMock();
    storage = makeStorageMock();
    service = new NotationService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService
    );
  });

  describe("getNotation", () => {
    it("lève NotFoundException si le groupe n'existe pas", async () => {
      prisma.groupe.findUnique.mockResolvedValue(null);
      await expect(service.getNotation("Z", 1, "ETF-2026-0001", "oral")).rejects.toThrow(
        NotFoundException
      );
    });

    it("lève NotFoundException si la séance n'existe pas", async () => {
      prisma.groupe.findUnique.mockResolvedValue(GROUPE);
      prisma.seance.findUnique.mockResolvedValue(null);
      await expect(service.getNotation("A", 99, "ETF-2026-0001", "oral")).rejects.toThrow(
        NotFoundException
      );
    });

    it("lève NotFoundException si l'apprenant n'existe pas", async () => {
      prisma.groupe.findUnique.mockResolvedValue(GROUPE);
      prisma.seance.findUnique.mockResolvedValue(SEANCE);
      prisma.apprenant.findUnique.mockResolvedValue(null);
      await expect(service.getNotation("A", 3, "inconnu", "oral")).rejects.toThrow(
        NotFoundException
      );
    });

    it("retourne null si aucune notation n'existe encore", async () => {
      prisma.groupe.findUnique.mockResolvedValue(GROUPE);
      prisma.seance.findUnique.mockResolvedValue(SEANCE);
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT);
      prisma.notation.findUnique.mockResolvedValue(null);
      expect(await service.getNotation("A", 3, "ETF-2026-0001", "oral")).toBeNull();
    });

    it("sérialise la notation (parse gridData JSON) quand elle existe", async () => {
      prisma.groupe.findUnique.mockResolvedValue(GROUPE);
      prisma.seance.findUnique.mockResolvedValue(SEANCE);
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT);
      prisma.notation.findUnique.mockResolvedValue({
        id: "n-1",
        competence: "oral",
        fileKey: null,
        fileName: null,
        soumisAt: null,
        gridData: JSON.stringify({ fluidite: 3 }),
        note: 14,
        commentaires: "bien",
        scoreOn20: 14,
        gradedAt: new Date("2026-02-01"),
      });

      const result = await service.getNotation("A", 3, "ETF-2026-0001", "oral");
      expect(result?.gridData).toEqual({ fluidite: 3 });
      expect(result?.scoreOn20).toBe(14);
    });

    it("gridData retombe à null si le JSON stocké est corrompu, plutôt que de planter", async () => {
      prisma.groupe.findUnique.mockResolvedValue(GROUPE);
      prisma.seance.findUnique.mockResolvedValue(SEANCE);
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT);
      prisma.notation.findUnique.mockResolvedValue({
        id: "n-1",
        competence: "oral",
        fileKey: null,
        fileName: null,
        soumisAt: null,
        gridData: "{not-json",
        note: null,
        commentaires: null,
        scoreOn20: null,
        gradedAt: null,
      });

      const result = await service.getNotation("A", 3, "ETF-2026-0001", "oral");
      expect(result?.gridData).toBeNull();
    });
  });

  describe("gradeNotation", () => {
    beforeEach(() => {
      prisma.groupe.findUnique.mockResolvedValue(GROUPE);
      prisma.seance.findUnique.mockResolvedValue(SEANCE);
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT);
    });

    it("upsert avec gridData sérialisé en JSON string et une date gradedAt", async () => {
      prisma.notation.upsert.mockResolvedValue({
        id: "n-1",
        competence: "oral",
        fileKey: null,
        fileName: null,
        soumisAt: null,
        gridData: JSON.stringify({ fluidite: 3 }),
        note: 14,
        commentaires: "bien",
        scoreOn20: 14,
        gradedAt: new Date(),
      });

      await service.gradeNotation("A", 3, "ETF-2026-0001", "oral", {
        gridData: { fluidite: 3 },
        note: 14,
        commentaires: "bien",
        scoreOn20: 14,
      });

      const call = prisma.notation.upsert.mock.calls[0][0];
      expect(call.where).toEqual({
        seanceId_apprenantId_competence: {
          seanceId: SEANCE.id,
          apprenantId: APPRENANT.id,
          competence: "oral",
        },
      });
      expect(call.create.gridData).toBe(JSON.stringify({ fluidite: 3 }));
      expect(call.update.gridData).toBe(JSON.stringify({ fluidite: 3 }));
      expect(call.create.gradedAt).toBeInstanceOf(Date);
    });

    it("laisse gridData undefined dans l'upsert si non fourni (ne l'écrase pas)", async () => {
      prisma.notation.upsert.mockResolvedValue({
        id: "n-1",
        competence: "oral",
        fileKey: null,
        fileName: null,
        soumisAt: null,
        gridData: null,
        note: 10,
        commentaires: null,
        scoreOn20: 10,
        gradedAt: new Date(),
      });

      await service.gradeNotation("A", 3, "ETF-2026-0001", "oral", { note: 10, scoreOn20: 10 });

      const call = prisma.notation.upsert.mock.calls[0][0];
      expect(call.create.gridData).toBeUndefined();
      expect(call.update.gridData).toBeUndefined();
    });
  });

  describe("listNotationsForSeance", () => {
    it("regroupe les scoreOn20 par matricule puis par compétence", async () => {
      prisma.groupe.findUnique.mockResolvedValue(GROUPE);
      prisma.seance.findUnique.mockResolvedValue(SEANCE);
      prisma.notation.findMany.mockResolvedValue([
        { apprenant: { matricule: "ETF-2026-0001" }, competence: "oral", scoreOn20: 14 },
        { apprenant: { matricule: "ETF-2026-0001" }, competence: "ecrit", scoreOn20: 10 },
        { apprenant: { matricule: "ETF-2026-0002" }, competence: "oral", scoreOn20: 8 },
      ]);

      const result = await service.listNotationsForSeance("A", 3);

      expect(result).toEqual({
        "ETF-2026-0001": { oral: { scoreOn20: 14 }, ecrit: { scoreOn20: 10 } },
        "ETF-2026-0002": { oral: { scoreOn20: 8 } },
      });
    });
  });

  describe("uploadDevoir", () => {
    const file = {
      originalname: "devoir.pdf",
      buffer: Buffer.from("contenu"),
      mimetype: "application/pdf",
    } as Express.Multer.File;

    it("lève NotFoundException si la séance de l'apprenant n'existe pas", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT);
      prisma.seance.findUnique.mockResolvedValue(null);
      await expect(service.uploadDevoir("ETF-2026-0001", 99, "oral", file)).rejects.toThrow(
        NotFoundException
      );
      expect(storage.uploadBuffer).not.toHaveBeenCalled();
    });

    it("dépose le fichier sous une clé stable et remet scoreOn20/gradedAt à null lors d'un redépôt", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT);
      prisma.seance.findUnique.mockResolvedValue(SEANCE);
      prisma.notation.upsert.mockResolvedValue({
        id: "n-1",
        competence: "oral",
        fileKey: `devoirs/${APPRENANT.id}/${SEANCE.id}-oral.pdf`,
        fileName: "devoir.pdf",
        soumisAt: new Date(),
        gridData: null,
        note: null,
        commentaires: null,
        scoreOn20: null,
        gradedAt: null,
      });

      await service.uploadDevoir("ETF-2026-0001", 3, "oral", file);

      expect(storage.uploadBuffer).toHaveBeenCalledWith(
        `devoirs/${APPRENANT.id}/${SEANCE.id}-oral.pdf`,
        file.buffer,
        "application/pdf"
      );
      const call = prisma.notation.upsert.mock.calls[0][0];
      expect(call.update.scoreOn20).toBeNull();
      expect(call.update.gradedAt).toBeNull();
      expect(call.update.fileName).toBe("devoir.pdf");
    });
  });

  describe("getDevoirStream", () => {
    it("lève NotFoundException si la notation n'a pas de fichier déposé", async () => {
      prisma.notation.findUnique.mockResolvedValue({ fileKey: null });
      await expect(service.getDevoirStream("n-1")).rejects.toThrow(NotFoundException);
    });

    it("lève NotFoundException si le fichier est introuvable dans le stockage", async () => {
      prisma.notation.findUnique.mockResolvedValue({ fileKey: "devoirs/x" });
      storage.getObjectStream.mockRejectedValue(new Error("not found in bucket"));
      await expect(service.getDevoirStream("n-1")).rejects.toThrow(NotFoundException);
    });

    it("retourne le stream quand tout va bien", async () => {
      prisma.notation.findUnique.mockResolvedValue({ fileKey: "devoirs/x" });
      const stream = { stream: "fake-stream", contentType: "application/pdf" };
      storage.getObjectStream.mockResolvedValue(stream);
      expect(await service.getDevoirStream("n-1")).toBe(stream);
    });
  });

  describe("listACorriger", () => {
    it("aplatit les notations non corrigées avec fichier déposé", async () => {
      prisma.notation.findMany.mockResolvedValue([
        {
          id: "n-1",
          apprenant: { matricule: "ETF-2026-0001", prenom: "Awa", nom: "Diallo" },
          seance: { numero: 3, groupe: { cle: "A", label: "Groupe A" } },
          competence: "oral",
          fileName: "devoir.pdf",
          soumisAt: new Date("2026-01-01"),
        },
      ]);

      const result = await service.listACorriger();

      expect(result).toEqual([
        {
          id: "n-1",
          apprenantMatricule: "ETF-2026-0001",
          apprenantPrenom: "Awa",
          apprenantNom: "Diallo",
          groupeCle: "A",
          groupeLabel: "Groupe A",
          numero: 3,
          competence: "oral",
          fileName: "devoir.pdf",
          soumisAt: new Date("2026-01-01"),
        },
      ]);
      expect(prisma.notation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { fileKey: { not: null }, gradedAt: null } })
      );
    });
  });
});
