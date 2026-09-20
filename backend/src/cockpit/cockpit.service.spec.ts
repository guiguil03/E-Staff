import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { CockpitService } from "./cockpit.service";
import { PrismaService } from "../prisma/prisma.service";

// Se concentre sur le scoping par formateur (2026-09-16) — les calculs
// d'agrégats eux-mêmes (moyennes, vivier, absences...) ne sont pas
// re-testés ici, seulement le fait qu'ils se limitent désormais aux groupes
// du formateur connecté quand un matricule est fourni.

function makePrismaMock() {
  return {
    apprenant: { findMany: jest.fn().mockResolvedValue([]) },
    notation: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn() },
    seance: { findMany: jest.fn().mockResolvedValue([]) },
    presence: { findMany: jest.fn().mockResolvedValue([]) },
    groupe: { findUnique: jest.fn() },
    formateur: { findUnique: jest.fn() },
    diffusion: { create: jest.fn(), findMany: jest.fn() },
  };
}

const GROUPE_A = { id: "groupe-a", cle: "A", label: "Groupe A", formateurId: "f-1" };
const GROUPE_B = { id: "groupe-b", cle: "B", label: "Groupe B", formateurId: "f-2" };
const FORMATEUR = { id: "f-1", matricule: "ETF-FORM-2026-0001" };
const AUTRE_FORMATEUR = { id: "f-2", matricule: "ETF-FORM-2026-0002" };

const APPRENANT_A = {
  id: "app-1",
  matricule: "ETF-2026-0001",
  prenom: "Awa",
  nom: "Diallo",
  groupeId: "groupe-a",
  groupe: GROUPE_A,
};
const APPRENANT_B = {
  id: "app-2",
  matricule: "ETF-2026-0002",
  prenom: "Njaka",
  nom: "R.",
  groupeId: "groupe-b",
  groupe: GROUPE_B,
};

describe("CockpitService — scoping par formateur", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let email: { send: jest.Mock };
  let service: CockpitService;

  beforeEach(() => {
    prisma = makePrismaMock();
    email = { send: jest.fn().mockResolvedValue({ delivered: true }) };
    service = new CockpitService(
      prisma as unknown as PrismaService,
      {} as never,
      email as never
    );
  });

  describe("getGroupes", () => {
    it("renvoie tous les groupes sans matricule fourni (vue admin/global)", async () => {
      prisma.apprenant.findMany.mockResolvedValue([APPRENANT_A, APPRENANT_B]);
      const result = await service.getGroupes();
      expect(result.map((g) => g.cle)).toEqual(["A", "B"]);
    });

    it("ne renvoie que les groupes du formateur connecté quand un matricule est fourni", async () => {
      prisma.apprenant.findMany.mockResolvedValue([APPRENANT_A, APPRENANT_B]);
      prisma.formateur.findUnique.mockResolvedValue(FORMATEUR);

      const result = await service.getGroupes(FORMATEUR.matricule);

      expect(result.map((g) => g.cle)).toEqual(["A"]);
    });
  });

  describe("getGroupeDetail", () => {
    it("lève NotFoundException si le groupe n'existe pas", async () => {
      prisma.groupe.findUnique.mockResolvedValue(null);
      await expect(service.getGroupeDetail("Z")).rejects.toThrow(NotFoundException);
    });

    it("rejette (Forbidden) un formateur qui n'encadre pas ce groupe", async () => {
      prisma.groupe.findUnique.mockResolvedValue(GROUPE_B);
      prisma.formateur.findUnique.mockResolvedValue(FORMATEUR);
      await expect(service.getGroupeDetail("B", FORMATEUR.matricule)).rejects.toThrow(
        ForbiddenException
      );
    });

    it("laisse passer le formateur qui encadre effectivement ce groupe", async () => {
      prisma.groupe.findUnique.mockResolvedValue(GROUPE_A);
      prisma.formateur.findUnique.mockResolvedValue(FORMATEUR);
      prisma.apprenant.findMany.mockResolvedValue([APPRENANT_A]);

      const result = await service.getGroupeDetail("A", FORMATEUR.matricule);

      expect(result.cle).toBe("A");
    });
  });

  describe("createDiffusion", () => {
    const formateur = { id: "f-1", matricule: "ETF-FORM-2026-0001", prenom: "Ravaka", nom: "Formateur" };
    const apprenant = { id: "app-1", prenom: "Awa", nom: "Diallo", email: "awa@example.com" };

    it("diffuse à tous les apprenants des groupes du formateur quand groupeId est nul", async () => {
      prisma.formateur.findUnique.mockResolvedValue(formateur);
      prisma.apprenant.findMany.mockResolvedValue([apprenant]);
      prisma.diffusion.create.mockResolvedValue({
        id: "d-1",
        formateurId: "f-1",
        groupeId: null,
        message: "Salut",
      });

      const result = await service.createDiffusion(formateur.matricule, null, "Salut");

      expect(prisma.apprenant.findMany).toHaveBeenCalledWith({
        where: { groupe: { formateurId: "f-1" } },
      });
      expect(prisma.diffusion.create).toHaveBeenCalledWith({
        data: { formateurId: "f-1", groupeId: null, message: "Salut" },
      });
      expect(email.send).toHaveBeenCalledTimes(1);
      expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ to: "awa@example.com" }));
      expect(result.destinatairesCount).toBe(1);
    });

    it("refuse de diffuser sur un groupe qui n'appartient pas au formateur", async () => {
      prisma.formateur.findUnique.mockResolvedValue(formateur);
      prisma.groupe.findUnique.mockResolvedValue(GROUPE_B);

      await expect(
        service.createDiffusion(formateur.matricule, "groupe-b", "Salut")
      ).rejects.toThrow(BadRequestException);
      expect(prisma.diffusion.create).not.toHaveBeenCalled();
      expect(email.send).not.toHaveBeenCalled();
    });

    it("diffuse uniquement aux apprenants du groupe ciblé quand groupeId est fourni", async () => {
      prisma.formateur.findUnique.mockResolvedValue(formateur);
      prisma.groupe.findUnique.mockResolvedValue(GROUPE_A);
      prisma.apprenant.findMany.mockResolvedValue([apprenant]);
      prisma.diffusion.create.mockResolvedValue({
        id: "d-2",
        formateurId: "f-1",
        groupeId: "groupe-a",
        message: "Salut",
      });

      await service.createDiffusion(formateur.matricule, "groupe-a", "Salut");

      expect(prisma.apprenant.findMany).toHaveBeenCalledWith({ where: { groupeId: "groupe-a" } });
      expect(email.send).toHaveBeenCalledTimes(1);
    });
  });
});
