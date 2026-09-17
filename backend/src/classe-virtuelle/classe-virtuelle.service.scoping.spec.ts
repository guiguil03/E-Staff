import { ForbiddenException } from "@nestjs/common";
import { ClasseVirtuelleService } from "./classe-virtuelle.service";
import { PrismaService } from "../prisma/prisma.service";
import { DailyService } from "./daily.service";
import { EmailService } from "../common/email.service";

// Se concentre sur le scoping par formateur (2026-09-16 — chaque formateur a
// désormais son propre compte, filtré sur Groupe.formateurId) : avant cette
// date un seul compte partagé voyait/gérait tous les groupes, ce fichier
// vérifie que ce n'est plus le cas. La logique métier pré-existante
// (planification, conflits d'horaire...) n'est pas re-testée ici.

function makePrismaMock() {
  return {
    groupe: { findUnique: jest.fn() },
    formateur: { findUnique: jest.fn() },
    seance: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    presence: { count: jest.fn().mockResolvedValue(0) },
    apprenant: { findUnique: jest.fn() },
  };
}

const GROUPE = { id: "groupe-1", cle: "A", label: "Groupe A", formateurId: "f-1" };
const FORMATEUR = { id: "f-1", matricule: "ETF-FORM-2026-0001", prenom: "Hasina", nom: "R." };
const AUTRE_FORMATEUR = { id: "f-2", matricule: "ETF-FORM-2026-0002", prenom: "Rado", nom: "T." };
const SEANCE = {
  id: "seance-1",
  groupeId: "groupe-1",
  numero: 3,
  startAt: null,
  dureeMinutes: 90,
  objectifs: null,
  dailyRoomName: null,
  dailyRoomUrl: null,
};

describe("ClasseVirtuelleService — scoping par formateur", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let service: ClasseVirtuelleService;

  beforeEach(() => {
    prisma = makePrismaMock();
    const daily = {} as DailyService;
    const email = { send: jest.fn().mockResolvedValue({ delivered: true }) } as unknown as EmailService;
    service = new ClasseVirtuelleService(prisma as unknown as PrismaService, daily, email);
  });

  describe("getSeance / upsertSeance / cancelSeance / getHistorique", () => {
    beforeEach(() => {
      prisma.groupe.findUnique.mockResolvedValue(GROUPE);
      prisma.seance.findUnique.mockResolvedValue(SEANCE);
    });

    it("getSeance rejette (Forbidden) un formateur qui n'encadre pas ce groupe", async () => {
      prisma.formateur.findUnique.mockResolvedValue(AUTRE_FORMATEUR);
      await expect(service.getSeance("A", 3, AUTRE_FORMATEUR.matricule)).rejects.toThrow(
        ForbiddenException
      );
    });

    it("getSeance laisse passer le formateur qui encadre effectivement ce groupe", async () => {
      prisma.formateur.findUnique.mockResolvedValue(FORMATEUR);
      await expect(service.getSeance("A", 3, FORMATEUR.matricule)).resolves.toMatchObject({
        groupeCle: "A",
      });
    });

    it("upsertSeance rejette (Forbidden) un formateur qui n'encadre pas ce groupe, sans écrire", async () => {
      prisma.formateur.findUnique.mockResolvedValue(AUTRE_FORMATEUR);
      await expect(
        service.upsertSeance("A", 3, { objectifs: "Nouvel objectif" }, AUTRE_FORMATEUR.matricule)
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.seance.update).not.toHaveBeenCalled();
    });

    it("getHistorique rejette (Forbidden) un formateur qui n'encadre pas ce groupe", async () => {
      prisma.formateur.findUnique.mockResolvedValue(AUTRE_FORMATEUR);
      await expect(service.getHistorique("A", AUTRE_FORMATEUR.matricule)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe("listSeances / getFormateurProchaineSeance", () => {
    it("listSeances ne renvoie que les séances des groupes du formateur connecté", async () => {
      prisma.formateur.findUnique.mockResolvedValue(FORMATEUR);
      prisma.seance.findMany.mockResolvedValue([]);

      await service.listSeances(FORMATEUR.matricule);

      expect(prisma.seance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { startAt: { not: null }, groupe: { formateurId: FORMATEUR.id } },
        })
      );
    });

    it("getFormateurProchaineSeance filtre aussi par formateurId", async () => {
      prisma.formateur.findUnique.mockResolvedValue(FORMATEUR);
      prisma.seance.findMany.mockResolvedValue([]);

      await service.getFormateurProchaineSeance(FORMATEUR.matricule);

      expect(prisma.seance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { startAt: { not: null }, groupe: { formateurId: FORMATEUR.id } },
        })
      );
    });
  });
});
