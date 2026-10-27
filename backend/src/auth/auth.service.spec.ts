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

// Même principe côté Formateur (matricule "ETF-FORM-2026-..." — voir
// AuthService.updateAccountPassword, qui se base sur ce préfixe pour savoir
// dans quelle table écrire).
async function makeFormateur(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "form-1",
    matricule: "ETF-FORM-2026-0002",
    prenom: "Hasina",
    nom: "Rakoto",
    email: "hasina@example.com",
    password: await bcrypt.hash("Sup3rSecret!", 10),
    resetToken: null,
    resetTokenExpiresAt: null,
    ...overrides,
  };
}

// Même principe côté Agent de production (matricule "ETF-AG-2026-..." —
// compte du 2026-10-22, voir AuthService.loginAgent). `statut` conditionne
// l'accès : un agent "inactif" ne peut plus se connecter.
async function makeAgent(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "agent-1",
    matricule: "ETF-AG-2026-0003",
    prenom: "Tiana",
    nom: "Randria",
    email: "tiana@example.com",
    statut: "actif",
    password: await bcrypt.hash("Sup3rSecret!", 10),
    resetToken: null,
    resetTokenExpiresAt: null,
    ...overrides,
  };
}

describe("AuthService", () => {
  let prisma: {
    apprenant: { findUnique: jest.Mock; update: jest.Mock };
    formateur: { findUnique: jest.Mock; update: jest.Mock };
    agent: { findUnique: jest.Mock; update: jest.Mock };
    compteStaff: { findUnique: jest.Mock; update: jest.Mock };
    compteSuperviseur: { findFirst: jest.Mock; update: jest.Mock };
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
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      agent: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      compteStaff: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      compteSuperviseur: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
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
      expect(await service.loginFormateur("ETF-FORM-2026-0002", "whatever")).toBeNull();
    });

    it("retourne null si le compte n'a pas encore de mot de passe", async () => {
      prisma.formateur.findUnique.mockResolvedValue(await makeFormateur({ password: null }));
      expect(await service.loginFormateur("ETF-FORM-2026-0002", "whatever")).toBeNull();
    });

    it("retourne null si le mot de passe est incorrect", async () => {
      prisma.formateur.findUnique.mockResolvedValue(await makeFormateur());
      expect(await service.loginFormateur("ETF-FORM-2026-0002", "mauvais-mdp")).toBeNull();
    });

    it("retourne le formateur si le mot de passe est correct", async () => {
      const formateur = await makeFormateur();
      prisma.formateur.findUnique.mockResolvedValue(formateur);
      expect(await service.loginFormateur("ETF-FORM-2026-0002", "Sup3rSecret!")).toBe(formateur);
    });
  });

  describe("loginAgent", () => {
    it("retourne null si le matricule est introuvable", async () => {
      prisma.agent.findUnique.mockResolvedValue(null);
      expect(await service.loginAgent("ETF-AG-2026-0003", "whatever")).toBeNull();
    });

    it("retourne null si le compte n'a pas encore de mot de passe", async () => {
      prisma.agent.findUnique.mockResolvedValue(await makeAgent({ password: null }));
      expect(await service.loginAgent("ETF-AG-2026-0003", "whatever")).toBeNull();
    });

    it("retourne null si le mot de passe est incorrect", async () => {
      prisma.agent.findUnique.mockResolvedValue(await makeAgent());
      expect(await service.loginAgent("ETF-AG-2026-0003", "mauvais-mdp")).toBeNull();
    });

    // Fin de contrat : le compte reste en base (historique missions/paie)
    // mais ne donne plus accès à l'Espace Agent.
    it("retourne null si l'agent est inactif, même avec le bon mot de passe", async () => {
      prisma.agent.findUnique.mockResolvedValue(await makeAgent({ statut: "inactif" }));
      expect(await service.loginAgent("ETF-AG-2026-0003", "Sup3rSecret!")).toBeNull();
    });

    it("retourne l'agent si le mot de passe est correct", async () => {
      const agent = await makeAgent();
      prisma.agent.findUnique.mockResolvedValue(agent);
      expect(await service.loginAgent("ETF-AG-2026-0003", "Sup3rSecret!")).toBe(agent);
    });
  });

  describe("loginSuperviseur", () => {
    const sup = { id: "s1", matricule: "ETF-SUP-2026-0001", prenom: "Lina", email: "l@x.mg" };

    it("retourne null sans compte d'accès (superviseur pas encore activé par la RH)", async () => {
      expect(await service.loginSuperviseur("ETF-SUP-2026-0001", "whatever")).toBeNull();
    });

    it("retourne null si le mot de passe est incorrect", async () => {
      prisma.compteSuperviseur.findFirst.mockResolvedValue({
        password: await bcrypt.hash("bon-mdp", 4),
        superviseur: sup,
      });
      expect(await service.loginSuperviseur("ETF-SUP-2026-0001", "mauvais")).toBeNull();
    });

    it("retourne le superviseur quand le mot de passe est correct", async () => {
      prisma.compteSuperviseur.findFirst.mockResolvedValue({
        password: await bcrypt.hash("bon-mdp", 4),
        superviseur: sup,
      });
      expect(await service.loginSuperviseur("ETF-SUP-2026-0001", "bon-mdp")).toEqual(sup);
    });
  });

  describe("mot de passe oublié — matricule Superviseur", () => {
    it("pose le jeton de réinitialisation sur le COMPTE (pas sur la fiche) et envoie l'e-mail", async () => {
      prisma.compteSuperviseur.findFirst.mockResolvedValue({
        id: "cs1",
        password: "x",
        resetTokenExpiresAt: null,
        superviseur: { matricule: "ETF-SUP-2026-0001", prenom: "Lina", email: "l@x.mg" },
      });

      await service.forgotPassword({ matricule: "ETF-SUP-2026-0001" } as never);

      expect(prisma.compteSuperviseur.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "cs1" }, data: expect.objectContaining({ resetToken: expect.any(String) }) })
      );
      expect(email.send).toHaveBeenCalledTimes(1);
    });
  });

  describe("changePassword — matricule Agent", () => {
    it("cherche dans Agent quand le matricule n'est ni Apprenant ni Formateur, et écrit dans Agent", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      prisma.formateur.findUnique.mockResolvedValue(null);
      const agent = await makeAgent();
      prisma.agent.findUnique.mockResolvedValue(agent);

      await service.changePassword({
        matricule: "ETF-AG-2026-0003",
        oldPassword: "Sup3rSecret!",
        newPassword: "nouveaunouveau",
      });

      expect(prisma.apprenant.update).not.toHaveBeenCalled();
      expect(prisma.formateur.update).not.toHaveBeenCalled();
      const { where, data } = prisma.agent.update.mock.calls[0][0];
      expect(where).toEqual({ id: agent.id });
      expect(await bcrypt.compare("nouveaunouveau", data.password)).toBe(true);
      // Changement de mot de passe = toutes les sessions tombent.
      expect(data.sessionsRevoqueesAt).toBeInstanceOf(Date);
    });
  });

  describe("changePassword — matricule Formateur (pas seulement Apprenant)", () => {
    it("cherche dans Formateur quand le matricule n'est pas un Apprenant, et écrit dans Formateur", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      const formateur = await makeFormateur();
      prisma.formateur.findUnique.mockResolvedValue(formateur);
      prisma.formateur.update.mockResolvedValue({ ...formateur });

      const result = await service.changePassword({
        matricule: formateur.matricule,
        oldPassword: "Sup3rSecret!",
        newPassword: "nouveaunouveau",
      });

      expect(result).toEqual({ ok: true });
      expect(prisma.formateur.update).toHaveBeenCalledTimes(1);
      expect(prisma.apprenant.update).not.toHaveBeenCalled();
      const { where, data } = prisma.formateur.update.mock.calls[0][0];
      expect(where).toEqual({ id: formateur.id });
      expect(await bcrypt.compare("nouveaunouveau", data.password)).toBe(true);
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

  describe("forgotPassword — matricule Formateur", () => {
    it("génère un token et l'enregistre dans Formateur quand le matricule n'est pas un Apprenant", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      const formateur = await makeFormateur();
      prisma.formateur.findUnique.mockResolvedValue(formateur);
      prisma.formateur.update.mockResolvedValue(formateur);

      const result = await service.forgotPassword({ matricule: formateur.matricule });

      expect(result).toEqual({ ok: true });
      expect(prisma.formateur.update).toHaveBeenCalledTimes(1);
      expect(prisma.apprenant.update).not.toHaveBeenCalled();
      const { where } = prisma.formateur.update.mock.calls[0][0];
      expect(where).toEqual({ id: formateur.id });
      expect(email.send).toHaveBeenCalledTimes(1);
      expect(email.send.mock.calls[0][0].to).toBe(formateur.email);
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

  describe("resetPassword — matricule Formateur", () => {
    it("met à jour le mot de passe dans Formateur quand le token appartient à un formateur", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      const formateur = await makeFormateur({
        resetToken: "abc",
        resetTokenExpiresAt: new Date(Date.now() + 1000),
      });
      prisma.formateur.findUnique.mockResolvedValue(formateur);
      prisma.formateur.update.mockResolvedValue(formateur);

      const result = await service.resetPassword({ token: "abc", newPassword: "nouveaunouveau" });

      expect(result).toEqual({ ok: true });
      expect(prisma.formateur.update).toHaveBeenCalledTimes(1);
      expect(prisma.apprenant.update).not.toHaveBeenCalled();
      const { where, data } = prisma.formateur.update.mock.calls[0][0];
      expect(where).toEqual({ id: formateur.id });
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

  describe("createAgentViewAsToken", () => {
    it("rejette un matricule introuvable", async () => {
      prisma.agent.findUnique.mockResolvedValue(null);
      await expect(service.createAgentViewAsToken("inconnu")).rejects.toThrow(NotFoundException);
    });

    it("refuse un agent inactif (session qu'il ne peut plus obtenir lui-même)", async () => {
      prisma.agent.findUnique.mockResolvedValue(await makeAgent({ statut: "inactif" }));
      await expect(service.createAgentViewAsToken("ETF-AG-2026-0003")).rejects.toThrow(
        BadRequestException
      );
    });

    it("émet un jeton consommable une seule fois, résolvant vers le rôle agent", async () => {
      prisma.agent.findUnique.mockResolvedValue(await makeAgent());

      const { token } = await service.createAgentViewAsToken("ETF-AG-2026-0003");

      expect(consumeViewAsToken(token)).toEqual({
        matricule: "ETF-AG-2026-0003",
        role: "agent",
      });
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
