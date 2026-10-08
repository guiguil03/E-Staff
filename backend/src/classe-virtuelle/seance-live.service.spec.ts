import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { SeanceLiveService } from "./seance-live.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage.service";

describe("SeanceLiveService", () => {
  let prisma: {
    groupe: { findUnique: jest.Mock };
    formateur: { findUnique: jest.Mock };
    seance: { findUnique: jest.Mock };
    apprenant: { findUnique: jest.Mock };
    noteFormateur: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
    tableauBlanc: { findUnique: jest.Mock; upsert: jest.Mock };
    tableauFichier: { upsert: jest.Mock; findUnique: jest.Mock };
  };
  let storage: { uploadBuffer: jest.Mock; getObjectStream: jest.Mock };
  let service: SeanceLiveService;

  beforeEach(() => {
    prisma = {
      groupe: { findUnique: jest.fn().mockResolvedValue({ id: "g-A", cle: "A", formateurId: "f-1" }) },
      formateur: { findUnique: jest.fn().mockResolvedValue({ id: "f-1" }) },
      seance: { findUnique: jest.fn().mockResolvedValue({ id: "s-8" }) },
      apprenant: { findUnique: jest.fn() },
      noteFormateur: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      tableauBlanc: { findUnique: jest.fn(), upsert: jest.fn() },
      tableauFichier: { upsert: jest.fn(), findUnique: jest.fn() },
    };
    storage = { uploadBuffer: jest.fn(), getObjectStream: jest.fn() };
    service = new SeanceLiveService(prisma as unknown as PrismaService, storage as unknown as StorageService);
  });

  it("refuse l'accès à un formateur qui n'encadre pas le groupe", async () => {
    prisma.formateur.findUnique.mockResolvedValue({ id: "f-2" });
    await expect(service.getNotes("A", 8, "ETF-FORM-2026-0002")).rejects.toThrow(ForbiddenException);
  });

  it("sépare la note de séance et les notes par apprenant", async () => {
    prisma.noteFormateur.findMany.mockResolvedValue([
      { apprenant: null, contenu: "Bonne dynamique" },
      { apprenant: { matricule: "ETF-2026-0001" }, contenu: "Revoir le subjonctif" },
    ]);
    await expect(service.getNotes("A", 8, "ETF-FORM-2026-0001")).resolves.toEqual({
      seance: "Bonne dynamique",
      apprenants: { "ETF-2026-0001": "Revoir le subjonctif" },
    });
  });

  it("refuse une note sur un apprenant d'un autre groupe", async () => {
    prisma.apprenant.findUnique.mockResolvedValue({ id: "a-9", groupeId: "g-B" });
    await expect(service.saveNote("A", 8, "ETF-FORM-2026-0001", "x", "ETF-2026-0009")).rejects.toThrow(
      BadRequestException
    );
    expect(prisma.noteFormateur.create).not.toHaveBeenCalled();
  });

  it("met à jour la note de séance existante (apprenantId null) au lieu d'en créer une autre", async () => {
    prisma.noteFormateur.findFirst.mockResolvedValue({ id: "n-1" });
    prisma.noteFormateur.update.mockResolvedValue({ contenu: "maj", updatedAt: new Date() });
    await service.saveNote("A", 8, "ETF-FORM-2026-0001", "maj");
    expect(prisma.noteFormateur.findFirst).toHaveBeenCalledWith({ where: { seanceId: "s-8", apprenantId: null } });
    expect(prisma.noteFormateur.update).toHaveBeenCalledWith({ where: { id: "n-1" }, data: { contenu: "maj" } });
  });

  it("incrémente la version du tableau à chaque sauvegarde", async () => {
    prisma.tableauBlanc.upsert.mockResolvedValue({ version: 4 });
    await expect(service.saveTableau("A", 8, "ETF-FORM-2026-0001", [{ id: "e1" }])).resolves.toEqual({ version: 4 });
    expect(prisma.tableauBlanc.upsert.mock.calls[0][0].update).toEqual({
      elements: JSON.stringify([{ id: "e1" }]),
      version: { increment: 1 },
    });
  });

  it("refuse une scène qui n'est pas une liste d'éléments", async () => {
    await expect(service.saveTableau("A", 8, "ETF-FORM-2026-0001", { hack: true })).rejects.toThrow(BadRequestException);
  });

  it("ne renvoie pas la scène à l'apprenant si sa version est déjà à jour", async () => {
    prisma.apprenant.findUnique.mockResolvedValue({ id: "a-1", groupeId: "g-A" });
    prisma.tableauBlanc.findUnique.mockResolvedValue({ version: 3, elements: "[]", fichiers: [] });
    await expect(service.getTableauApprenant("ETF-2026-0001", 8, 3)).resolves.toEqual({ version: 3, inchange: true });
    await expect(service.getTableauApprenant("ETF-2026-0001", 8, 2)).resolves.toEqual({
      version: 3,
      elements: [],
      fichiers: [],
    });
  });

  it("n'accepte que des images sur le tableau", async () => {
    const pdf = { mimetype: "application/pdf", buffer: Buffer.from("x") } as Express.Multer.File;
    await expect(service.uploadFichierTableau("A", 8, "ETF-FORM-2026-0001", "f1", pdf)).rejects.toThrow(
      BadRequestException
    );
    expect(storage.uploadBuffer).not.toHaveBeenCalled();
  });

  // Régression XSS stocké (audit sécurité du 2026-10-08) : un SVG contenant
  // du script déclarait "image/svg+xml", ce qui passait le seul filtre
  // existant (startsWith("image/")) — rien ne vérifiait la signature
  // binaire réelle avant de stocker, ni au moment de resservir le fichier.
  it("refuse un fichier dont le contenu ne correspond pas à une image réelle, même avec un mimetype image/*", async () => {
    const fauxSvg = {
      mimetype: "image/svg+xml",
      buffer: Buffer.from("<svg onload=\"alert(1)\"></svg>"),
    } as Express.Multer.File;
    await expect(
      service.uploadFichierTableau("A", 8, "ETF-FORM-2026-0001", "f1", fauxSvg)
    ).rejects.toThrow(BadRequestException);
    expect(storage.uploadBuffer).not.toHaveBeenCalled();
  });

  it("accepte une vraie image (signature PNG valide)", async () => {
    const png = {
      mimetype: "image/png",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    } as Express.Multer.File;
    await service.uploadFichierTableau("A", 8, "ETF-FORM-2026-0001", "f1", png);
    expect(storage.uploadBuffer).toHaveBeenCalledWith("tableaux/s-8/f1", png.buffer, "image/png");
  });

  it("ressert le Content-Type assaini par le stockage, jamais le mimeType brut stocké en base", async () => {
    prisma.tableauFichier.findUnique.mockResolvedValue({
      seanceId: "s-8",
      fileId: "f1",
      storageKey: "tableaux/s-8/f1",
      // mimeType brut historique potentiellement dangereux (ex. ligne
      // créée avant ce durcissement) — ne doit jamais ressortir tel quel.
      mimeType: "image/svg+xml",
    });
    storage.getObjectStream.mockResolvedValue({ stream: "un-stream", contentType: "application/octet-stream" });

    const result = await service.getFichierFormateur("A", 8, "ETF-FORM-2026-0001", "f1");

    expect(result.contentType).toBe("application/octet-stream");
  });
});
