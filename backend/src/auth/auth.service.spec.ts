import * as bcrypt from "bcryptjs";
import { BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { consumeViewAsToken } from "../common/view-as-token";

// Petit helper : un Apprenant "réel" avec mot de passe déjà haché, pour
// exercer bcrypt.compare/hash comme en prod plutôt que de mocker bcrypt.
async function makeApprenant(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "app-1",
    matricule: "ETF-2026-0001",
    prenom: "Awa",
    nom: "Diallo",
    email: "awa@example.com",
    password: await bcrypt.hash("Sup3rSecret!", 10),
    resetToken: null,
    resetTokenExpiresAt: null,
    ...overrides,
  };
}

async function makeFormateur(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "f-1",
    matricule: "ETF-FORM-2026-0001",
    prenom: "Hasina",
    nom: "R.",
    email: "hasina@example.com",
    password: await bcrypt.hash("Sup3rSecret!", 10),
    ...overrides,
  };
}

describe("AuthService", () => {
  let prisma: {
    apprenant: { findUnique: jest.Mock; update: jest.Mock };
    formateur: { findUnique: jest.Mock };
  };
  let email: { send: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      apprenant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      formateur: {
        findUnique: jest.fn(),
      },
    };
    email = { send: jest.fn().mockResolvedValue({ delivered: true }) };
    service = new AuthService(
      prisma as unknown as PrismaService,
      email as unknown as EmailService
    );
  });

  describe("loginApprenant", () => {
    it("retourne null si le matricule est introuvable", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      expect(await service.loginApprenant("ETF-2026-0001", "whatever")).toBeNull();
    });

    it("retourne null si le compte n'a pas encore de mot de passe (pas encore activé)", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(await makeApprenant({ password: null }));
      expect(await service.loginApprenant("ETF-2026-0001", "whatever")).toBeNull();
    });

    it("retourne null si le mot de passe est incorrect", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(await makeApprenant());
      expect(await service.loginApprenant("ETF-2026-0001", "mauvais-mdp")).toBeNull();
    });

    it("retourne l'apprenant si le mot de passe est correct", async () => {
      const apprenant = await makeApprenant();
      prisma.apprenant.findUnique.mockResolvedValue(apprenant);
      expect(await service.loginApprenant("ETF-2026-0001", "Sup3rSecret!")).toBe(apprenant);
    });
  });

  describe("loginFormateur", () => {
    it("retourne null si le matricule est introuvable", async () => {
      prisma.formateur.findUnique.mockResolvedValue(null);
      expect(await service.loginFormateur("ETF-FORM-2026-0001", "whatever")).toBeNull();
    });

    it("retourne null si le compte n'a pas encore de mot de passe (identifiants pas encore émis par la RH)", async () => {
      prisma.formateur.findUnique.mockResolvedValue(await makeFormateur({ password: null }));
      expect(await service.loginFormateur("ETF-FORM-2026-0001", "whatever")).toBeNull();
    });

    it("retourne null si le mot de passe est incorrect", async () => {
      prisma.formateur.findUnique.mockResolvedValue(await makeFormateur());
      expect(await service.loginFormateur("ETF-FORM-2026-0001", "mauvais-mdp")).toBeNull();
    });

    it("retourne le formateur si le mot de passe est correct", async () => {
      const formateur = await makeFormateur();
      prisma.formateur.findUnique.mockResolvedValue(formateur);
      expect(await service.loginFormateur("ETF-FORM-2026-0001", "Sup3rSecret!")).toBe(formateur);
    });
  });

  describe("changePassword", () => {
    it("rejette si le matricule est introuvable", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      await expect(
        service.changePassword({
          matricule: "inconnu",
          oldPassword: "x",
          newPassword: "nouveaunouveau",
        })
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.apprenant.update).not.toHaveBeenCalled();
    });

    it("rejette si l'ancien mot de passe est incorrect", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(await makeApprenant());
      await expect(
        service.changePassword({
          matricule: "ETF-2026-0001",
          oldPassword: "mauvais",
          newPassword: "nouveaunouveau",
        })
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.apprenant.update).not.toHaveBeenCalled();
    });

    it("hache et enregistre le nouveau mot de passe si l'ancien est correct", async () => {
      const apprenant = await makeApprenant();
      prisma.apprenant.findUnique.mockResolvedValue(apprenant);
      prisma.apprenant.update.mockResolvedValue({ ...apprenant });

      const result = await service.changePassword({
        matricule: "ETF-2026-0001",
        oldPassword: "Sup3rSecret!",
        newPassword: "nouveaunouveau",
      });

      expect(result).toEqual({ ok: true });
      expect(prisma.apprenant.update).toHaveBeenCalledTimes(1);
      const { data } = prisma.apprenant.update.mock.calls[0][0];
      expect(data.password).not.toBe(apprenant.password);
      expect(await bcrypt.compare("nouveaunouveau", data.password)).toBe(true);
    });
  });

  describe("forgotPassword", () => {
    it("répond {ok:true} sans rien écrire ni envoyer d'e-mail si le matricule n'existe pas", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ matricule: "inconnu" });

      expect(result).toEqual({ ok: true });
      expect(prisma.apprenant.update).not.toHaveBeenCalled();
      expect(email.send).not.toHaveBeenCalled();
    });

    it("génère un token, l'enregistre avec une expiration à ~1h et envoie l'e-mail si le matricule existe", async () => {
      const apprenant = await makeApprenant();
      prisma.apprenant.findUnique.mockResolvedValue(apprenant);
      prisma.apprenant.update.mockResolvedValue(apprenant);

      const before = Date.now();
      const result = await service.forgotPassword({ matricule: apprenant.matricule });
      const after = Date.now();

      expect(result).toEqual({ ok: true });
      expect(prisma.apprenant.update).toHaveBeenCalledTimes(1);
      const { where, data } = prisma.apprenant.update.mock.calls[0][0];
      expect(where).toEqual({ id: apprenant.id });
      expect(typeof data.resetToken).toBe("string");
      expect(data.resetToken.length).toBeGreaterThan(20);

      const expiresAt = (data.resetTokenExpiresAt as Date).getTime();
      expect(expiresAt).toBeGreaterThanOrEqual(before + 60 * 60 * 1000 - 1000);
      expect(expiresAt).toBeLessThanOrEqual(after + 60 * 60 * 1000 + 1000);

      expect(email.send).toHaveBeenCalledTimes(1);
      const emailArgs = email.send.mock.calls[0][0];
      expect(emailArgs.to).toBe(apprenant.email);
      expect(emailArgs.text).toContain(data.resetToken);
    });
  });

  describe("resetPassword", () => {
    it("rejette un token inconnu", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      await expect(
        service.resetPassword({ token: "inconnu", newPassword: "nouveaunouveau" })
      ).rejects.toThrow(BadRequestException);
    });

    it("rejette un token expiré", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(
        await makeApprenant({
          resetToken: "abc",
          resetTokenExpiresAt: new Date(Date.now() - 1000),
        })
      );
      await expect(
        service.resetPassword({ token: "abc", newPassword: "nouveaunouveau" })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.apprenant.update).not.toHaveBeenCalled();
    });

    it("met à jour le mot de passe et efface le token si celui-ci est valide", async () => {
      const apprenant = await makeApprenant({
        resetToken: "abc",
        resetTokenExpiresAt: new Date(Date.now() + 1000),
      });
      prisma.apprenant.findUnique.mockResolvedValue(apprenant);
      prisma.apprenant.update.mockResolvedValue(apprenant);

      const result = await service.resetPassword({ token: "abc", newPassword: "nouveaunouveau" });

      expect(result).toEqual({ ok: true });
      const { where, data } = prisma.apprenant.update.mock.calls[0][0];
      expect(where).toEqual({ id: apprenant.id });
      expect(data.resetToken).toBeNull();
      expect(data.resetTokenExpiresAt).toBeNull();
      expect(await bcrypt.compare("nouveaunouveau", data.password)).toBe(true);
    });
  });

  describe("createApprenantViewAsToken", () => {
    it("rejette un matricule introuvable", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      await expect(service.createApprenantViewAsToken("inconnu")).rejects.toThrow(
        NotFoundException
      );
    });

    it("émet un jeton consommable une seule fois, résolvant vers le bon matricule", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(await makeApprenant());

      const { token } = await service.createApprenantViewAsToken("ETF-2026-0001");

      expect(consumeViewAsToken(token)).toEqual({ matricule: "ETF-2026-0001", role: "apprenant" });
      // Usage unique : la deuxième consommation échoue.
      expect(consumeViewAsToken(token)).toBeNull();
    });
  });

  describe("createFormateurViewAsToken", () => {
    it("rejette un matricule introuvable", async () => {
      prisma.formateur.findUnique.mockResolvedValue(null);
      await expect(service.createFormateurViewAsToken("inconnu")).rejects.toThrow(
        NotFoundException
      );
    });

    it("émet un jeton consommable une seule fois, résolvant vers le bon matricule et le rôle formateur", async () => {
      prisma.formateur.findUnique.mockResolvedValue(await makeFormateur());

      const { token } = await service.createFormateurViewAsToken("ETF-FORM-2026-0001");

      expect(consumeViewAsToken(token)).toEqual({
        matricule: "ETF-FORM-2026-0001",
        role: "formateur",
      });
      expect(consumeViewAsToken(token)).toBeNull();
    });
  });
});
