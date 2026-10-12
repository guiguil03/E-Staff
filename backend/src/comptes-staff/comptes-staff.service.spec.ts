import * as bcrypt from "bcryptjs";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ComptesStaffService } from "./comptes-staff.service";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";

// bcrypt réel plutôt que mocké (même convention que auth.service.spec.ts) —
// on vérifie le mot de passe temporaire renvoyé via bcrypt.compare contre
// le hash effectivement stocké, pas une valeur en dur.

function makePrismaMock() {
  return {
    compteStaff: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

const ANNEE = new Date().getFullYear();

describe("ComptesStaffService", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let email: { send: jest.Mock };
  let service: ComptesStaffService;
  const envBackup = { ...process.env };

  beforeEach(() => {
    prisma = makePrismaMock();
    email = { send: jest.fn().mockResolvedValue({ delivered: true }) };
    service = new ComptesStaffService(prisma as unknown as PrismaService, email as unknown as EmailService);
    delete process.env.ADMIN_TEST_MATRICULE;
    delete process.env.RH_TEST_MATRICULE;
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  describe("list", () => {
    it("indique l'identifiant partagé admin comme configuré mais inactif quand un compte admin nominatif existe", async () => {
      process.env.ADMIN_TEST_MATRICULE = "ADMIN_TEST";
      prisma.compteStaff.findMany.mockResolvedValue([
        { id: "c-1", matricule: "ADM-2026-0001", role: "admin", prenom: "A", nom: "B", email: "a@x.com", actif: true, createdAt: new Date() },
      ]);

      const result = await service.list();

      expect(result.identifiantsPartages.admin).toEqual({ configure: true, actif: false });
      expect(result.identifiantsPartages.rh).toEqual({ configure: false, actif: true });
      expect(result.comptes).toHaveLength(1);
    });

    it("considère l'identifiant partagé actif quand aucun compte nominatif de ce rôle n'est actif", async () => {
      prisma.compteStaff.findMany.mockResolvedValue([
        { id: "c-1", matricule: "ADM-2026-0001", role: "admin", prenom: "A", nom: "B", email: "a@x.com", actif: false, createdAt: new Date() },
      ]);

      const result = await service.list();

      expect(result.identifiantsPartages.admin.actif).toBe(true);
    });
  });

  describe("create", () => {
    it("génère le premier matricule de l'année pour un rôle sans compte existant", async () => {
      prisma.compteStaff.findFirst.mockResolvedValue(null);
      prisma.compteStaff.create.mockImplementation(({ data }) => Promise.resolve({ id: "c-1", ...data, actif: true, createdAt: new Date() }));

      const result = await service.create({ role: "rh", prenom: "Mina", nom: "R.", email: "mina@example.com" });

      expect(result.compte.matricule).toBe(`RH-${ANNEE}-0001`);
      expect(prisma.compteStaff.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { matricule: { startsWith: `RH-${ANNEE}-` } } })
      );
    });

    it("incrémente à partir du dernier matricule existant pour ce rôle", async () => {
      prisma.compteStaff.findFirst.mockResolvedValue({ matricule: `ADM-${ANNEE}-0007` });
      prisma.compteStaff.create.mockImplementation(({ data }) => Promise.resolve({ id: "c-2", ...data, actif: true, createdAt: new Date() }));

      const result = await service.create({ role: "admin", prenom: "Jo", nom: "Doe", email: "jo@example.com" });

      expect(result.compte.matricule).toBe(`ADM-${ANNEE}-0008`);
    });

    it("hashe le mot de passe temporaire renvoyé (jamais en clair en base)", async () => {
      prisma.compteStaff.create.mockImplementation(({ data }) => Promise.resolve({ id: "c-3", ...data, actif: true, createdAt: new Date() }));

      const result = await service.create({ role: "rh", prenom: "Mina", nom: "R.", email: "mina@example.com" });

      const dataPassee = prisma.compteStaff.create.mock.calls[0][0].data;
      expect(dataPassee.password).not.toBe(result.motDePasseTemporaire);
      await expect(bcrypt.compare(result.motDePasseTemporaire, dataPassee.password)).resolves.toBe(true);
    });

    it("envoie l'e-mail d'accès avec le matricule et le mot de passe temporaire", async () => {
      prisma.compteStaff.create.mockImplementation(({ data }) => Promise.resolve({ id: "c-4", ...data, actif: true, createdAt: new Date() }));

      const result = await service.create({ role: "admin", prenom: "Jo", nom: "Doe", email: "jo@example.com" });

      expect(email.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "jo@example.com",
          subject: expect.stringContaining("Votre accès Admin"),
          text: expect.stringContaining(result.motDePasseTemporaire),
        })
      );
    });
  });

  describe("setActif", () => {
    const COMPTE = { id: "c-1", matricule: "ADM-2026-0001", role: "admin", actif: true };

    it("lève NotFoundException si le compte n'existe pas", async () => {
      prisma.compteStaff.findUnique.mockResolvedValue(null);

      await expect(service.setActif("inconnu", false, "ADM-2026-0002")).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it("refuse de désactiver son propre compte", async () => {
      prisma.compteStaff.findUnique.mockResolvedValue(COMPTE);

      await expect(service.setActif(COMPTE.id, false, COMPTE.matricule)).rejects.toBeInstanceOf(
        BadRequestException
      );
      expect(prisma.compteStaff.update).not.toHaveBeenCalled();
    });

    it("révoque les sessions en cours à la désactivation d'un autre compte", async () => {
      prisma.compteStaff.findUnique.mockResolvedValue(COMPTE);
      prisma.compteStaff.update.mockResolvedValue({ ...COMPTE, actif: false });

      await service.setActif(COMPTE.id, false, "ADM-2026-0002");

      expect(prisma.compteStaff.update).toHaveBeenCalledWith({
        where: { id: COMPTE.id },
        data: { actif: false, sessionsRevoqueesAt: expect.any(Date) },
      });
    });

    it("ne touche pas sessionsRevoqueesAt à la réactivation", async () => {
      prisma.compteStaff.findUnique.mockResolvedValue({ ...COMPTE, actif: false });
      prisma.compteStaff.update.mockResolvedValue({ ...COMPTE, actif: true });

      await service.setActif(COMPTE.id, true, "ADM-2026-0002");

      expect(prisma.compteStaff.update).toHaveBeenCalledWith({
        where: { id: COMPTE.id },
        data: { actif: true },
      });
    });
  });

  describe("regenererMotDePasse", () => {
    it("lève NotFoundException si le compte n'existe pas", async () => {
      prisma.compteStaff.findUnique.mockResolvedValue(null);

      await expect(service.regenererMotDePasse("inconnu")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("régénère le mot de passe, révoque les sessions, et notifie par e-mail", async () => {
      const compte = { id: "c-1", matricule: "RH-2026-0001", role: "rh", prenom: "Mina", email: "mina@example.com" };
      prisma.compteStaff.findUnique.mockResolvedValue(compte);
      prisma.compteStaff.update.mockResolvedValue(compte);

      const result = await service.regenererMotDePasse(compte.id);

      expect(prisma.compteStaff.update).toHaveBeenCalledWith({
        where: { id: compte.id },
        data: { password: expect.any(String), sessionsRevoqueesAt: expect.any(Date) },
      });
      const hashEnvoye = prisma.compteStaff.update.mock.calls[0][0].data.password;
      await expect(bcrypt.compare(result.motDePasseTemporaire, hashEnvoye)).resolves.toBe(true);
      expect(email.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: compte.email, subject: expect.stringContaining("nouveaux identifiants") })
      );
      expect(result.ok).toBe(true);
    });
  });
});
