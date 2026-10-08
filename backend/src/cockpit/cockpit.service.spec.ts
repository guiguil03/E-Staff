import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { CockpitService } from "./cockpit.service";
import { PrismaService } from "../prisma/prisma.service";

// Se concentre sur le scoping par formateur (2026-09-16) — les calculs
// d'agrégats eux-mêmes (moyennes, vivier, absences...) ne sont pas
// re-testés ici, seulement le fait qu'ils se limitent désormais aux groupes
// du formateur connecté quand un matricule est fourni.

function makePrismaMock() {
  return {
    apprenant: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn(), update: jest.fn() },
    notation: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    seance: { findMany: jest.fn().mockResolvedValue([]) },
    presence: { findMany: jest.fn().mockResolvedValue([]) },
    groupe: { findUnique: jest.fn() },
    formateur: { findUnique: jest.fn() },
    diffusion: { create: jest.fn(), findMany: jest.fn() },
    bilanFormateur: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    compteStaff: { findMany: jest.fn().mockResolvedValue([]) },
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

  describe("listApprenants", () => {
    it("ne renvoie que les apprenants des groupes du formateur connecté", async () => {
      prisma.formateur.findUnique.mockResolvedValue(FORMATEUR);
      prisma.apprenant.findMany.mockResolvedValue([
        { matricule: "ETF-2026-0001", prenom: "Awa", nom: "Diallo", groupe: { cle: "A" } },
      ]);

      const result = await service.listApprenants(FORMATEUR.matricule);

      expect(prisma.apprenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { groupe: { formateurId: FORMATEUR.id } } })
      );
      expect(result).toEqual([{ matricule: "ETF-2026-0001", prenom: "Awa", nom: "Diallo", groupeCle: "A" }]);
    });

    it("lève NotFoundException si le matricule ne correspond à aucun formateur", async () => {
      prisma.formateur.findUnique.mockResolvedValue(null);
      await expect(service.listApprenants("inconnu")).rejects.toThrow(NotFoundException);
    });
  });

  describe("getApprenantFiche", () => {
    const APPRENANT_DETAIL = { id: "app-1", matricule: "ETF-2026-0001", prenom: "Awa", nom: "Diallo", groupe: GROUPE_A };

    it("lève NotFoundException si le matricule n'existe pas", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      await expect(service.getApprenantFiche("inconnu")).rejects.toThrow(NotFoundException);
    });

    it("lève ForbiddenException si l'apprenant n'est pas dans un groupe du formateur connecté", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT_DETAIL);
      prisma.formateur.findUnique.mockResolvedValue(AUTRE_FORMATEUR);

      await expect(
        service.getApprenantFiche(APPRENANT_DETAIL.matricule, AUTRE_FORMATEUR.matricule)
      ).rejects.toThrow(ForbiddenException);
    });

    it("renvoie moyenne, compétences et rendus en attente à partir des vraies notations", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT_DETAIL);
      prisma.apprenant.findMany.mockResolvedValue([{ ...APPRENANT_DETAIL, groupeId: GROUPE_A.id }]);
      prisma.notation.findMany
        .mockResolvedValueOnce([
          { apprenantId: "app-1", competence: "expression_orale", scoreOn20: 16, seance: { numero: 1 } },
          { apprenantId: "app-1", competence: "expression_ecrite", scoreOn20: 14, seance: { numero: 1 } },
          { apprenantId: "app-1", competence: "comprehension_orale", scoreOn20: 15, seance: { numero: 1 } },
          { apprenantId: "app-1", competence: "comprehension_ecrite", scoreOn20: 13, seance: { numero: 1 } },
          { apprenantId: "app-1", competence: "posture_eloquence", scoreOn20: 17, seance: { numero: 1 } },
        ])
        .mockResolvedValueOnce([
          { id: "not-1", competence: "expression_orale", fileName: "devoir.mp3", soumisAt: new Date("2026-09-01"), seance: { numero: 2 } },
        ]);

      const result = await service.getApprenantFiche(APPRENANT_DETAIL.matricule);

      expect(result.moyenneGlobale).toBe(75); // 16+14+15+13+17
      expect(result.groupeCle).toBe("A");
      expect(result.history[0]).toEqual({ label: "S1", moyenne: 75 });
      expect(result.rendusEnAttente).toEqual([
        { id: "not-1", competence: "expression_orale", numero: 2, fileName: "devoir.mp3", soumisAt: new Date("2026-09-01") },
      ]);
    });
  });

  describe("getProfil", () => {
    it("renvoie le prénom/nom du formateur connecté (2026-09-22 — remplace le prénom de démo en dur)", async () => {
      prisma.formateur.findUnique.mockResolvedValue({ ...FORMATEUR, prenom: "Awa", nom: "Rakoto" });

      const result = await service.getProfil(FORMATEUR.matricule);

      expect(result).toEqual({ prenom: "Awa", nom: "Rakoto" });
    });

    it("lève NotFoundException si le matricule ne correspond à aucun formateur", async () => {
      prisma.formateur.findUnique.mockResolvedValue(null);
      await expect(service.getProfil("inconnu")).rejects.toThrow(NotFoundException);
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

  describe("getEloquenceParGroupe", () => {
    it("moyenne le score posture_eloquence à la séance la plus avancée où les 5 compétences sont notées", async () => {
      prisma.apprenant.findMany.mockResolvedValue([APPRENANT_A]);
      prisma.notation.findMany.mockResolvedValue([
        { apprenantId: "app-1", competence: "comprehension_orale", scoreOn20: 12, seance: { numero: 1 } },
        { apprenantId: "app-1", competence: "expression_orale", scoreOn20: 12, seance: { numero: 1 } },
        { apprenantId: "app-1", competence: "comprehension_ecrite", scoreOn20: 12, seance: { numero: 1 } },
        { apprenantId: "app-1", competence: "expression_ecrite", scoreOn20: 12, seance: { numero: 1 } },
        { apprenantId: "app-1", competence: "posture_eloquence", scoreOn20: 15, seance: { numero: 1 } },
      ]);

      const result = await service.getEloquenceParGroupe();

      expect(result.get("A")).toBe(15);
    });

    it("ignore un apprenant dont aucune séance n'a les 5 compétences notées", async () => {
      prisma.apprenant.findMany.mockResolvedValue([APPRENANT_A]);
      prisma.notation.findMany.mockResolvedValue([
        { apprenantId: "app-1", competence: "posture_eloquence", scoreOn20: 15, seance: { numero: 1 } },
      ]);

      const result = await service.getEloquenceParGroupe();

      expect(result.has("A")).toBe(false);
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

    it("envoie un message privé à un seul apprenant du formateur, sans passer par les annonces de groupe", async () => {
      prisma.formateur.findUnique.mockResolvedValue(formateur);
      prisma.apprenant.findUnique.mockResolvedValue({
        ...apprenant,
        matricule: "ETF-2026-0001",
        groupeId: "groupe-a",
        groupe: GROUPE_A,
      });
      prisma.diffusion.create.mockResolvedValue({ id: "d-3", apprenantId: "app-1" });

      const result = await service.createDiffusion(formateur.matricule, null, "Bravo", "ETF-2026-0001");

      expect(prisma.diffusion.create).toHaveBeenCalledWith({
        data: { formateurId: "f-1", groupeId: "groupe-a", apprenantId: "app-1", message: "Bravo" },
      });
      expect(prisma.apprenant.findMany).not.toHaveBeenCalled();
      expect(email.send).toHaveBeenCalledTimes(1);
      expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ to: "awa@example.com" }));
      expect(result.destinatairesCount).toBe(1);
    });

    it("refuse un message privé à un apprenant d'un autre formateur", async () => {
      prisma.formateur.findUnique.mockResolvedValue(formateur);
      prisma.apprenant.findUnique.mockResolvedValue({
        ...apprenant,
        groupeId: "groupe-b",
        groupe: GROUPE_B,
      });

      await expect(
        service.createDiffusion(formateur.matricule, null, "Salut", "ETF-2026-0009")
      ).rejects.toThrow(BadRequestException);
      expect(prisma.diffusion.create).not.toHaveBeenCalled();
      expect(email.send).not.toHaveBeenCalled();
    });

    it("lève NotFoundException si l'apprenant visé n'existe pas", async () => {
      prisma.formateur.findUnique.mockResolvedValue(formateur);
      prisma.apprenant.findUnique.mockResolvedValue(null);

      await expect(
        service.createDiffusion(formateur.matricule, null, "Salut", "inconnu")
      ).rejects.toThrow(NotFoundException);
      expect(prisma.diffusion.create).not.toHaveBeenCalled();
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

describe("CockpitService — paiements et abonnements limités aux groupes du formateur (audit 2026-09-28)", () => {
  it("ne liste que les apprenants des groupes du formateur connecté", async () => {
    const prisma = makePrismaMock();
    prisma.formateur.findUnique.mockResolvedValue(FORMATEUR);
    const service = new CockpitService(prisma as unknown as PrismaService, {} as never, {} as never);
    await service.getPaiements(FORMATEUR.matricule);
    expect(prisma.apprenant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { groupe: { formateurId: FORMATEUR.id } } })
    );
  });

  it("refuse de modifier l'abonnement d'un apprenant d'un autre groupe", async () => {
    const prisma = makePrismaMock();
    prisma.formateur.findUnique.mockResolvedValue(FORMATEUR);
    prisma.apprenant.findUnique.mockResolvedValue(APPRENANT_B);
    const service = new CockpitService(prisma as unknown as PrismaService, {} as never, {} as never);
    await expect(
      service.setAbonnementExpireAt(APPRENANT_B.matricule, new Date(), FORMATEUR.matricule)
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.apprenant.update).not.toHaveBeenCalled();
  });

  it("efface la demande de renouvellement en attente en même temps que la nouvelle échéance", async () => {
    const prisma = makePrismaMock();
    prisma.apprenant.findUnique.mockResolvedValue(APPRENANT_A);
    prisma.apprenant.update.mockResolvedValue({ ...APPRENANT_A, groupe: GROUPE_A });
    const service = new CockpitService(prisma as unknown as PrismaService, {} as never, {} as never);

    const expireAt = new Date("2027-01-01");
    await service.setAbonnementExpireAt(APPRENANT_A.matricule, expireAt);

    expect(prisma.apprenant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          abonnementExpireAt: expireAt,
          renewalPaymentReference: null,
          renewalPaymentReceiptKey: null,
          renewalRequestedAt: null,
        },
      })
    );
  });
});

describe("CockpitService — bilan hebdomadaire (historique, PDF, notification RH)", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let email: { send: jest.Mock };
  let service: CockpitService;

  beforeEach(() => {
    prisma = makePrismaMock();
    email = { send: jest.fn().mockResolvedValue({ delivered: true }) };
    prisma.formateur.findUnique.mockResolvedValue({ ...FORMATEUR, prenom: "Jean", nom: "Rakoto" });
    service = new CockpitService(prisma as unknown as PrismaService, {} as never, email as never);
  });

  describe("getRapportHebdo — evolutionVsSemainePrecedente", () => {
    it("renvoie null sans matricule de formateur fourni", async () => {
      const result = await service.getRapportHebdo();
      expect(result.evolutionVsSemainePrecedente).toBeNull();
      expect(prisma.bilanFormateur.findFirst).not.toHaveBeenCalled();
    });

    it("renvoie null quand ce formateur n'a encore aucun bilan validé", async () => {
      prisma.bilanFormateur.findFirst.mockResolvedValue(null);

      const result = await service.getRapportHebdo(FORMATEUR.matricule);

      expect(prisma.bilanFormateur.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { formateurId: FORMATEUR.id } })
      );
      expect(result.evolutionVsSemainePrecedente).toBeNull();
    });

    it("calcule la différence de moyenne générale par rapport au dernier bilan", async () => {
      const COMPETENCIES = [
        "comprehension_orale",
        "expression_orale",
        "comprehension_ecrite",
        "expression_ecrite",
        "posture_eloquence",
      ];
      prisma.apprenant.findMany.mockResolvedValue([{ id: "app-1", groupe: GROUPE_A }]);
      prisma.notation.findMany.mockResolvedValue(
        COMPETENCIES.map((competence) => ({
          apprenantId: "app-1",
          competence,
          scoreOn20: 20,
          seance: { numero: 1 },
        }))
      );
      prisma.bilanFormateur.findFirst.mockResolvedValue({
        statsSnapshot: { moyenneGenerale: 70, tauxPresenceGlobal: null },
      });

      const result = await service.getRapportHebdo(FORMATEUR.matricule);

      expect(result.moyenneGenerale).toBe(100);
      expect(result.evolutionVsSemainePrecedente).toEqual({
        moyenneGenerale: 30,
        tauxPresenceGlobal: null,
      });
    });
  });

  describe("submitBilanHebdo — notification RH", () => {
    const dto = { constat: "Bon rythme.", analyse: "Groupe homogène.", axes: "Travailler l'oral." };

    it("notifie les comptes RH actifs après la création du bilan", async () => {
      prisma.bilanFormateur.create.mockResolvedValue({
        id: "bilan-1",
        formateurId: FORMATEUR.id,
        createdAt: new Date("2026-10-08"),
      });
      prisma.compteStaff.findMany.mockResolvedValue([
        { prenom: "Mina", email: "mina@example.com" },
        { prenom: "Sans-email", email: "" },
      ]);

      await service.submitBilanHebdo(FORMATEUR.matricule, dto);

      expect(prisma.compteStaff.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: "rh", actif: true } })
      );
      expect(email.send).toHaveBeenCalledTimes(1);
      expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ to: "mina@example.com" }));
    });

    it("ne bloque pas la validation du bilan si l'envoi d'e-mail échoue", async () => {
      prisma.bilanFormateur.create.mockResolvedValue({
        id: "bilan-1",
        formateurId: FORMATEUR.id,
        createdAt: new Date("2026-10-08"),
      });
      prisma.compteStaff.findMany.mockRejectedValue(new Error("DB indisponible"));

      const result = await service.submitBilanHebdo(FORMATEUR.matricule, dto);

      expect(result.id).toBe("bilan-1");
    });
  });

  describe("listMesBilans", () => {
    it("délègue à listBilansFormateur avec l'id du formateur résolu depuis le matricule", async () => {
      prisma.bilanFormateur.findMany.mockResolvedValue([{ id: "bilan-1" }]);

      const result = await service.listMesBilans(FORMATEUR.matricule);

      expect(prisma.bilanFormateur.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { formateurId: FORMATEUR.id } })
      );
      expect(result).toEqual([{ id: "bilan-1" }]);
    });
  });

  describe("generateBilanPdf", () => {
    it("lève NotFoundException si le bilan n'appartient pas à ce formateur", async () => {
      prisma.bilanFormateur.findUnique.mockResolvedValue({ id: "bilan-1", formateurId: "autre-formateur" });

      await expect(service.generateBilanPdf("bilan-1", FORMATEUR.matricule)).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it("lève NotFoundException si le bilan n'existe pas", async () => {
      prisma.bilanFormateur.findUnique.mockResolvedValue(null);

      await expect(service.generateBilanPdf("bilan-inconnu", FORMATEUR.matricule)).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it("génère un PDF (buffer non vide) pour un bilan appartenant à ce formateur", async () => {
      prisma.bilanFormateur.findUnique.mockResolvedValue({
        id: "bilan-1",
        formateurId: FORMATEUR.id,
        createdAt: new Date("2026-10-08"),
        constat: "Bon rythme.",
        analyse: "Groupe homogène.",
        axes: "Travailler l'oral.",
        statsSnapshot: {
          moyenneGenerale: 80,
          tauxPresenceGlobal: 90,
          rendusCorriges7j: 5,
          vivierC1Total: 2,
          alertesDecrochageActuelles: 0,
        },
      });

      const pdf = await service.generateBilanPdf("bilan-1", FORMATEUR.matricule);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });
  });
});
