import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { SupportCoursService } from "./support-cours.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage.service";
import { EmailService } from "../common/email.service";

function makePrismaMock() {
  return {
    formateur: { findUnique: jest.fn() },
    groupe: { findUnique: jest.fn() },
    apprenant: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn() },
    supportCours: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
}

const FORMATEUR = { id: "formateur-1", matricule: "ETF-FORM-2026-0001" };
const AUTRE_FORMATEUR = { id: "formateur-2", matricule: "ETF-FORM-2026-0002" };
const GROUPE = { id: "groupe-1", cle: "A", label: "Groupe A", formateurId: FORMATEUR.id };
const APPRENANT = {
  id: "app-1",
  matricule: "ETF-2026-0001",
  groupeId: GROUPE.id,
  email: "a@example.com",
  prenom: "Awa",
};

describe("SupportCoursService", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let storage: { uploadFile: jest.Mock; getObjectStream: jest.Mock; deleteObject: jest.Mock };
  let email: { send: jest.Mock };
  let service: SupportCoursService;

  beforeEach(() => {
    prisma = makePrismaMock();
    storage = {
      uploadFile: jest.fn().mockResolvedValue(undefined),
      getObjectStream: jest.fn().mockResolvedValue({ stream: "un-stream", contentType: "application/pdf" }),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };
    email = { send: jest.fn().mockResolvedValue({ delivered: true }) };
    service = new SupportCoursService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
      email as unknown as EmailService
    );
    prisma.formateur.findUnique.mockResolvedValue(FORMATEUR);
    prisma.groupe.findUnique.mockResolvedValue(GROUPE);
  });

  function fichier(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
    return {
      originalname: "cours.pdf",
      mimetype: "application/pdf",
      path: "/tmp/upload-fake-path",
      ...overrides,
    } as Express.Multer.File;
  }

  describe("uploadSupport", () => {
    it("lève NotFoundException si le formateur n'existe pas", async () => {
      prisma.formateur.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadSupport(FORMATEUR.matricule, GROUPE.cle, null, fichier())
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("lève ForbiddenException si le formateur n'encadre pas ce groupe", async () => {
      prisma.groupe.findUnique.mockResolvedValue({ ...GROUPE, formateurId: AUTRE_FORMATEUR.id });

      await expect(
        service.uploadSupport(FORMATEUR.matricule, GROUPE.cle, null, fichier())
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });

    it("uploade le fichier (en flux depuis le disque), crée la ligne, et notifie tous les apprenants du groupe", async () => {
      prisma.supportCours.create.mockImplementation(({ data }) => Promise.resolve({ id: "support-1", ...data }));
      prisma.apprenant.findMany.mockResolvedValue([
        APPRENANT,
        { ...APPRENANT, id: "app-2", matricule: "ETF-2026-0002", email: "b@example.com", prenom: "Njaka" },
      ]);

      const result = await service.uploadSupport(FORMATEUR.matricule, GROUPE.cle, 3, fichier());
      // La notification des apprenants n'est plus attendue par uploadSupport
      // (audit scalabilité du 2026-10-08, fire-and-forget).
      await new Promise((resolve) => setImmediate(resolve));

      expect(storage.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining(`supports-cours/${GROUPE.id}/`),
        "/tmp/upload-fake-path",
        "application/pdf"
      );
      expect(prisma.supportCours.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ formateurId: FORMATEUR.id, groupeId: GROUPE.id, seanceNumero: 3 }),
        })
      );
      expect(email.send).toHaveBeenCalledTimes(2);
      expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ to: "a@example.com" }));
      expect(result.groupeCle).toBe(GROUPE.cle);
    });
  });

  describe("listSupportsForFormateur", () => {
    it("lève ForbiddenException si le formateur n'encadre pas ce groupe", async () => {
      prisma.groupe.findUnique.mockResolvedValue({ ...GROUPE, formateurId: AUTRE_FORMATEUR.id });

      await expect(
        service.listSupportsForFormateur(FORMATEUR.matricule, GROUPE.cle)
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("renvoie les supports du groupe avec la clé de groupe ajoutée", async () => {
      prisma.supportCours.findMany.mockResolvedValue([{ id: "support-1", groupeId: GROUPE.id }]);

      const result = await service.listSupportsForFormateur(FORMATEUR.matricule, GROUPE.cle);

      expect(result).toEqual([{ id: "support-1", groupeId: GROUPE.id, groupeCle: GROUPE.cle }]);
    });
  });

  describe("getSupportStreamForFormateur", () => {
    it("lève NotFoundException si le support n'existe pas", async () => {
      prisma.supportCours.findUnique.mockResolvedValue(null);

      await expect(
        service.getSupportStreamForFormateur(FORMATEUR.matricule, "support-inconnu")
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("autorise le formateur qui a déposé le support", async () => {
      prisma.supportCours.findUnique.mockResolvedValue({
        id: "support-1",
        formateurId: FORMATEUR.id,
        groupeId: GROUPE.id,
        storageKey: "key-1",
        mimeType: "application/pdf",
        filename: "cours.pdf",
      });

      const result = await service.getSupportStreamForFormateur(FORMATEUR.matricule, "support-1");

      expect(storage.getObjectStream).toHaveBeenCalledWith("key-1");
      expect(result.filename).toBe("cours.pdf");
    });

    it("autorise le formateur qui encadre désormais le groupe même s'il n'a pas déposé le support", async () => {
      prisma.supportCours.findUnique.mockResolvedValue({
        id: "support-1",
        formateurId: AUTRE_FORMATEUR.id,
        groupeId: GROUPE.id,
        storageKey: "key-1",
        mimeType: "application/pdf",
        filename: "cours.pdf",
      });

      await expect(
        service.getSupportStreamForFormateur(FORMATEUR.matricule, "support-1")
      ).resolves.toMatchObject({ filename: "cours.pdf" });
    });

    it("refuse un formateur qui n'a ni déposé le support ni n'encadre le groupe", async () => {
      prisma.supportCours.findUnique.mockResolvedValue({
        id: "support-1",
        formateurId: AUTRE_FORMATEUR.id,
        groupeId: GROUPE.id,
        storageKey: "key-1",
        mimeType: "application/pdf",
        filename: "cours.pdf",
      });
      prisma.groupe.findUnique.mockResolvedValue({ ...GROUPE, formateurId: AUTRE_FORMATEUR.id });

      await expect(
        service.getSupportStreamForFormateur(FORMATEUR.matricule, "support-1")
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("deleteSupport", () => {
    it("lève NotFoundException si le support n'existe pas", async () => {
      prisma.supportCours.findUnique.mockResolvedValue(null);

      await expect(service.deleteSupport(FORMATEUR.matricule, "support-inconnu")).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it("refuse de supprimer le support d'un groupe qu'il n'encadre pas", async () => {
      prisma.supportCours.findUnique.mockResolvedValue({ id: "support-1", groupeId: GROUPE.id, storageKey: "key-1" });
      prisma.groupe.findUnique.mockResolvedValue({ ...GROUPE, formateurId: AUTRE_FORMATEUR.id });

      await expect(service.deleteSupport(FORMATEUR.matricule, "support-1")).rejects.toBeInstanceOf(
        ForbiddenException
      );
      expect(storage.deleteObject).not.toHaveBeenCalled();
    });

    it("supprime le fichier du stockage puis la ligne en base", async () => {
      prisma.supportCours.findUnique.mockResolvedValue({ id: "support-1", groupeId: GROUPE.id, storageKey: "key-1" });

      const result = await service.deleteSupport(FORMATEUR.matricule, "support-1");

      expect(storage.deleteObject).toHaveBeenCalledWith("key-1");
      expect(prisma.supportCours.delete).toHaveBeenCalledWith({ where: { id: "support-1" } });
      expect(result).toEqual({ ok: true });
    });
  });

  describe("listSupportsForApprenant", () => {
    it("lève NotFoundException si l'apprenant n'existe pas", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);

      await expect(service.listSupportsForApprenant("ETF-2026-9999")).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it("ne renvoie jamais la clé de stockage interne", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT);
      prisma.supportCours.findMany.mockResolvedValue([
        { id: "support-1", groupeId: GROUPE.id, storageKey: "key-secrete", filename: "cours.pdf" },
      ]);

      const result = await service.listSupportsForApprenant(APPRENANT.matricule);

      expect(result).toEqual([{ id: "support-1", groupeId: GROUPE.id, filename: "cours.pdf" }]);
    });
  });

  describe("getSupportStreamForApprenant", () => {
    it("lève NotFoundException si le support n'existe pas", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT);
      prisma.supportCours.findUnique.mockResolvedValue(null);

      await expect(
        service.getSupportStreamForApprenant(APPRENANT.matricule, "support-inconnu")
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Régression du correctif du 2026-09-25 (voir support-cours.controller.ts) :
    // un apprenant ne doit jamais pouvoir lire un support d'un autre groupe,
    // même en devinant un id de support valide.
    it("refuse l'accès à un support d'un autre groupe que celui de l'apprenant", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT);
      prisma.supportCours.findUnique.mockResolvedValue({
        id: "support-1",
        groupeId: "autre-groupe",
        storageKey: "key-1",
        mimeType: "application/pdf",
        filename: "cours.pdf",
      });

      await expect(
        service.getSupportStreamForApprenant(APPRENANT.matricule, "support-1")
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.getObjectStream).not.toHaveBeenCalled();
    });

    it("renvoie le flux pour un support du groupe de l'apprenant", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT);
      prisma.supportCours.findUnique.mockResolvedValue({
        id: "support-1",
        groupeId: GROUPE.id,
        storageKey: "key-1",
        mimeType: "application/pdf",
        filename: "cours.pdf",
      });

      const result = await service.getSupportStreamForApprenant(APPRENANT.matricule, "support-1");

      expect(storage.getObjectStream).toHaveBeenCalledWith("key-1");
      expect(result.filename).toBe("cours.pdf");
    });
  });
});
