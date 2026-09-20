import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { NotationService } from "./notation.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage.service";
import { EmailService } from "../common/email.service";

function makePrismaMock() {
  return {
    groupe: { findUnique: jest.fn() },
    seance: { findUnique: jest.fn(), findMany: jest.fn() },
    apprenant: { findUnique: jest.fn() },
    formateur: { findUnique: jest.fn() },
    notation: { findUnique: jest.fn(), findMany: jest.fn(), upsert: jest.fn() },
    presence: { findMany: jest.fn() },
    diffusion: { findMany: jest.fn() },
  };
}

function makeStorageMock() {
  return { uploadBuffer: jest.fn(), getObjectStream: jest.fn() };
}

const GROUPE = { id: "groupe-1", cle: "A", label: "Groupe A", formateurId: "f-1" };
const FORMATEUR = { id: "f-1", matricule: "ETF-FORM-2026-0001" };
const AUTRE_FORMATEUR = { id: "f-2", matricule: "ETF-FORM-2026-0002" };
const SEANCE = { id: "seance-1", groupeId: "groupe-1", numero: 3, startAt: new Date("2026-01-01") };
const APPRENANT = {
  id: "app-1",
  matricule: "ETF-2026-0001",
  prenom: "Awa",
  nom: "Diallo",
  email: "awa@example.com",
};

describe("NotationService", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let storage: ReturnType<typeof makeStorageMock>;
  let email: { send: jest.Mock };
  let service: NotationService;

  beforeEach(() => {
    prisma = makePrismaMock();
    storage = makeStorageMock();
    email = { send: jest.fn().mockResolvedValue({ delivered: true }) };
    service = new NotationService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
      email as unknown as EmailService
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

    it("envoie un e-mail à l'apprenant quand un nouveau commentaire est ajouté", async () => {
      prisma.notation.findUnique.mockResolvedValue(null); // pas de notation existante
      prisma.notation.upsert.mockResolvedValue({
        id: "n-1",
        competence: "expression_ecrite",
        commentaires: "Attention aux temps verbaux.",
        scoreOn20: 14,
        gradedAt: new Date(),
      });

      await service.gradeNotation("A", 3, "ETF-2026-0001", "expression_ecrite", {
        scoreOn20: 14,
        commentaires: "Attention aux temps verbaux.",
      });

      expect(email.send).toHaveBeenCalledTimes(1);
      const args = email.send.mock.calls[0][0];
      expect(args.to).toBe("awa@example.com");
      expect(args.text).toContain("Attention aux temps verbaux.");
      expect(args.text).toContain("Expression écrite");
    });

    it("ne renvoie pas d'e-mail si le commentaire est inchangé", async () => {
      prisma.notation.findUnique.mockResolvedValue({ commentaires: "Bon travail." });
      prisma.notation.upsert.mockResolvedValue({
        id: "n-1",
        competence: "expression_ecrite",
        commentaires: "Bon travail.",
        scoreOn20: 16,
        gradedAt: new Date(),
      });

      await service.gradeNotation("A", 3, "ETF-2026-0001", "expression_ecrite", {
        scoreOn20: 16,
        commentaires: "Bon travail.",
      });

      expect(email.send).not.toHaveBeenCalled();
    });

    it("n'envoie pas d'e-mail si aucun commentaire n'est fourni", async () => {
      prisma.notation.findUnique.mockResolvedValue(null);
      prisma.notation.upsert.mockResolvedValue({
        id: "n-1",
        competence: "oral",
        commentaires: null,
        scoreOn20: 12,
        gradedAt: new Date(),
      });

      await service.gradeNotation("A", 3, "ETF-2026-0001", "oral", { scoreOn20: 12 });

      expect(email.send).not.toHaveBeenCalled();
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

    it("rejette (Forbidden) si le formateur connecté n'encadre pas le groupe de cette notation", async () => {
      prisma.notation.findUnique.mockResolvedValue({
        fileKey: "devoirs/x",
        seance: { groupe: GROUPE },
      });
      prisma.formateur.findUnique.mockResolvedValue(AUTRE_FORMATEUR);

      await expect(service.getDevoirStream("n-1", AUTRE_FORMATEUR.matricule)).rejects.toThrow(
        ForbiddenException
      );
      expect(storage.getObjectStream).not.toHaveBeenCalled();
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

    it("filtre aux groupes du formateur connecté quand un matricule est fourni", async () => {
      prisma.formateur.findUnique.mockResolvedValue(FORMATEUR);
      prisma.notation.findMany.mockResolvedValue([]);

      await service.listACorriger(FORMATEUR.matricule);

      expect(prisma.notation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            fileKey: { not: null },
            gradedAt: null,
            seance: { groupe: { formateurId: FORMATEUR.id } },
          },
        })
      );
    });
  });

  describe("scoping par formateur (comptes individuels)", () => {
    beforeEach(() => {
      prisma.groupe.findUnique.mockResolvedValue(GROUPE);
      prisma.seance.findUnique.mockResolvedValue(SEANCE);
      prisma.apprenant.findUnique.mockResolvedValue(APPRENANT);
    });

    it("getNotation rejette (Forbidden) un formateur qui n'encadre pas ce groupe", async () => {
      prisma.formateur.findUnique.mockResolvedValue(AUTRE_FORMATEUR);
      await expect(
        service.getNotation("A", 3, "ETF-2026-0001", "oral", AUTRE_FORMATEUR.matricule)
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.notation.findUnique).not.toHaveBeenCalled();
    });

    it("getNotation laisse passer le formateur qui encadre effectivement ce groupe", async () => {
      prisma.formateur.findUnique.mockResolvedValue(FORMATEUR);
      prisma.notation.findUnique.mockResolvedValue(null);
      await expect(
        service.getNotation("A", 3, "ETF-2026-0001", "oral", FORMATEUR.matricule)
      ).resolves.toBeNull();
    });

    it("gradeNotation rejette (Forbidden) un formateur qui n'encadre pas ce groupe, sans écrire la notation", async () => {
      prisma.formateur.findUnique.mockResolvedValue(AUTRE_FORMATEUR);
      await expect(
        service.gradeNotation(
          "A",
          3,
          "ETF-2026-0001",
          "oral",
          { scoreOn20: 14 },
          AUTRE_FORMATEUR.matricule
        )
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.notation.upsert).not.toHaveBeenCalled();
    });

    it("listNotationsForSeance rejette (Forbidden) un formateur qui n'encadre pas ce groupe", async () => {
      prisma.formateur.findUnique.mockResolvedValue(AUTRE_FORMATEUR);
      await expect(
        service.listNotationsForSeance("A", 3, AUTRE_FORMATEUR.matricule)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("getApprenantDashboard", () => {
    it("lève NotFoundException si l'apprenant n'existe pas", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      await expect(service.getApprenantDashboard("inconnu")).rejects.toThrow(NotFoundException);
    });

    it("consolide diagnostic initial, évolution cumulée, assiduité et commentaire — sans rien inventer pour l'apprenant sans historique", async () => {
      const now = Date.now();
      const heure = 60 * 60 * 1000;
      const jour = 24 * heure;

      prisma.apprenant.findUnique.mockResolvedValue({
        id: "app-1",
        matricule: "ETF-2026-0001",
        prenom: "Awa",
        groupeId: "groupe-1",
        createdAt: new Date(now - 100 * jour),
        abonnementExpireAt: new Date(now + 30 * jour),
        groupe: {
          label: "Groupe A",
          typeCours: "DELF DALF",
          formateur: { prenom: "Hasina", nom: "R." },
        },
        evaluationAttempt: {
          tier: "niveau_c1",
          totalScore: 78,
          lexiqueScore: 16,
          oralScore: 14,
          situationsScore: 15,
          videoScore: 17,
          essayScore: 16,
        },
      });

      const seanceOnTime = { id: "s-1", startAt: new Date(now - 2 * heure) };
      const seanceRetard = { id: "s-2", startAt: new Date(now - heure) };
      const seanceAbsence = { id: "s-3", startAt: new Date(now - 30 * 60 * 1000) };
      const seanceFuture = { id: "s-4", numero: 4, startAt: new Date(now + 3 * jour), objectifs: null };
      prisma.seance.findMany.mockResolvedValue([
        { ...seanceOnTime, numero: 1, objectifs: null },
        { ...seanceRetard, numero: 2, objectifs: null },
        { ...seanceAbsence, numero: 3, objectifs: "Atelier expression écrite" },
        seanceFuture,
      ]);
      prisma.presence.findMany.mockResolvedValue([
        { seanceId: "s-1", joinedAt: new Date(seanceOnTime.startAt.getTime() + 2 * 60 * 1000) },
        { seanceId: "s-2", joinedAt: new Date(seanceRetard.startAt.getTime() + 15 * 60 * 1000) },
        // pas de présence pour s-3 : absence.
      ]);

      prisma.notation.findMany.mockResolvedValue([
        {
          competence: "comprehension_orale",
          scoreOn20: 14,
          gradedAt: new Date(now),
          commentaires: null,
        },
        {
          competence: "expression_orale",
          scoreOn20: 10,
          gradedAt: new Date(now - 400 * jour), // hors mois en cours
          commentaires: "Ancien commentaire, hors période.",
        },
        {
          competence: "expression_ecrite",
          scoreOn20: 8,
          gradedAt: new Date(now),
          commentaires: "Attention aux temps verbaux.",
        },
        {
          competence: "posture_eloquence",
          scoreOn20: 16,
          gradedAt: new Date(now - heure),
          commentaires: "Bon travail.",
        },
      ]);

      const result = await service.getApprenantDashboard("ETF-2026-0001");

      expect(result.diagnosticInitial).toEqual({
        tier: "niveau_c1",
        totalScore: 78,
        blocs: [
          { key: "lexique", label: "Lexique", score: 16 },
          { key: "oral", label: "Oral", score: 14 },
          { key: "situations", label: "Situations", score: 15 },
          { key: "video", label: "Vidéo", score: 17 },
          { key: "essai", label: "Essai", score: 16 },
        ],
      });

      // Moyenne des 4 compétences notées (14, 10, 8, 16) = 12/20 -> 60%.
      // comprehension_ecrite n'a jamais été notée : absente, jamais un 0 inventé.
      expect(result.tauxReussiteGlobal).toBe(60);
      expect(result.alerteCompetence).toEqual({ key: "expression_ecrite", score: 8 });

      // Seules comprehension_orale (14), expression_ecrite (8) et
      // posture_eloquence (16) sont gradées ce mois-ci : moyenne 12.67/20 -> 63%.
      expect(result.tauxEvolutionMensuel).toBe(63);

      // Commentaire le plus récent parmi ceux du mois en cours.
      expect(result.commentaireFormateur).toEqual({
        text: "Attention aux temps verbaux.",
        author: "Hasina R., Formateur",
      });

      // 3 séances passées le même jour (même semaine ISO) : 1 absence, 1 retard.
      expect(result.seancesEffectuees).toBe(3);
      expect(result.seancesTotal).toBe(4);
      expect(result.assiduite).toHaveLength(1);
      expect(result.assiduite[0]).toMatchObject({ tauxAbsence: 33, retards: 1, statut: "attention" });

      expect(result.prochaineSeance).toEqual({
        numero: 4,
        titre: "Séance 4",
        startAt: seanceFuture.startAt,
      });
    });

    it("ne fabrique aucune donnée quand l'apprenant n'a ni test d'admission ni notation ni séance passée", async () => {
      prisma.apprenant.findUnique.mockResolvedValue({
        id: "app-2",
        matricule: "ETF-2026-0002",
        prenom: "Njaka",
        groupeId: "groupe-1",
        createdAt: new Date(),
        abonnementExpireAt: null,
        groupe: { label: "Groupe A", typeCours: null, formateur: null },
        evaluationAttempt: null,
      });
      prisma.seance.findMany.mockResolvedValue([]);
      prisma.presence.findMany.mockResolvedValue([]);
      prisma.notation.findMany.mockResolvedValue([]);

      const result = await service.getApprenantDashboard("ETF-2026-0002");

      expect(result.diagnosticInitial).toBeNull();
      expect(result.tauxReussiteGlobal).toBeNull();
      expect(result.alerteCompetence).toBeNull();
      expect(result.commentaireFormateur).toBeNull();
      expect(result.prochaineSeance).toBeNull();
      expect(result.tauxEvolutionMensuel).toBe(0);
      expect(result.assiduite).toEqual([]);
    });
  });

  describe("listAnnoncesForApprenant", () => {
    it("récupère les annonces ciblées sur son groupe et celles diffusées sur tous les groupes de son formateur", async () => {
      prisma.apprenant.findUnique.mockResolvedValue({
        matricule: APPRENANT.matricule,
        groupeId: GROUPE.id,
        groupe: GROUPE,
      });
      prisma.diffusion.findMany.mockResolvedValue([]);

      await service.listAnnoncesForApprenant(APPRENANT.matricule);

      expect(prisma.diffusion.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ groupeId: GROUPE.id }, { groupeId: null, formateurId: "f-1" }],
        },
        include: { formateur: true },
        orderBy: { createdAt: "desc" },
      });
    });

    it("ne cherche que les annonces de son propre groupe si aucun formateur n'est encore assigné", async () => {
      const groupeSansFormateur = { ...GROUPE, formateurId: null };
      prisma.apprenant.findUnique.mockResolvedValue({
        matricule: APPRENANT.matricule,
        groupeId: groupeSansFormateur.id,
        groupe: groupeSansFormateur,
      });
      prisma.diffusion.findMany.mockResolvedValue([]);

      await service.listAnnoncesForApprenant(APPRENANT.matricule);

      expect(prisma.diffusion.findMany).toHaveBeenCalledWith({
        where: { OR: [{ groupeId: groupeSansFormateur.id }] },
        include: { formateur: true },
        orderBy: { createdAt: "desc" },
      });
    });

    it("lève une erreur si l'apprenant n'existe pas", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);

      await expect(service.listAnnoncesForApprenant("inconnu")).rejects.toThrow(NotFoundException);
    });
  });
});
