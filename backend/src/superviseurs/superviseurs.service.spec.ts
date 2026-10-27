import * as bcrypt from "bcryptjs";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { SuperviseursService } from "./superviseurs.service";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { DailyService } from "../classe-virtuelle/daily.service";

// Espace Superviseur : ce que cette suite fige, c'est le PÉRIMÈTRE — un
// superviseur ne valide, ne contacte et ne planifie que pour SES agents — et
// la sortie exploitable par le client (CSV : journées validées seulement,
// protégé contre l'injection de formule).

function makePrisma() {
  return {
    superviseur: {
      findUnique: jest.fn().mockResolvedValue({ id: "sup-1", matricule: "SUP-1", prenom: "Lina", nom: "S", email: "l@x.mg", compte: null }),
    },
    compteSuperviseur: { upsert: jest.fn().mockResolvedValue({}) },
    suiviAgentJournalier: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    mission: {
      findMany: jest.fn().mockResolvedValue([{ agentId: "ag-1" }, { agentId: "ag-2" }]),
      findFirst: jest.fn(),
    },
    alerteAgent: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    messageSuperviseur: { create: jest.fn().mockResolvedValue({ id: "msg-1" }) },
    reunionSuperviseur: {
      create: jest.fn((args: { data: Record<string, any> }) => Promise.resolve({ id: "r1", dureeMin: args.data.dureeMin, titre: args.data.titre })),
    },
    agent: {
      findMany: jest.fn().mockResolvedValue([
        { id: "ag-1", prenom: "A", email: "a@x.mg" },
        { id: "ag-2", prenom: "B", email: "b@x.mg" },
      ]),
    },
  };
}

describe("SuperviseursService", () => {
  let prisma: ReturnType<typeof makePrisma>;
  let email: { send: jest.Mock };
  let service: SuperviseursService;

  beforeEach(() => {
    prisma = makePrisma();
    email = { send: jest.fn().mockResolvedValue({ delivered: true }) };
    service = new SuperviseursService(
      prisma as unknown as PrismaService,
      email as unknown as EmailService,
      { createRoom: jest.fn(), mintMeetingToken: jest.fn(), deleteRoom: jest.fn() } as unknown as DailyService
    );
  });

  describe("validation des heures", () => {
    it("refuse une journée qui n'appartient pas à son équipe", async () => {
      prisma.suiviAgentJournalier.findUnique.mockResolvedValue({ id: "j1", mission: { superviseurId: "autre" } });

      await expect(service.validerJournee("SUP-1", "j1", {})).rejects.toThrow(ForbiddenException);
      expect(prisma.suiviAgentJournalier.update).not.toHaveBeenCalled();
    });

    it("valide une journée de son équipe avec la note du superviseur", async () => {
      prisma.suiviAgentJournalier.findUnique.mockResolvedValue({ id: "j1", mission: { superviseurId: "sup-1" } });

      await service.validerJournee("SUP-1", "j1", { commentaire: " Panne fibre validée " });

      expect(prisma.suiviAgentJournalier.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ statutValidation: "valide", commentaireSuperviseur: "Panne fibre validée" }),
        })
      );
    });
  });

  describe("alertes & messages", () => {
    it("refuse de traiter l'alerte d'un agent hors de son équipe", async () => {
      prisma.alerteAgent.findUnique.mockResolvedValue({ id: "al1", agentId: "etranger" });
      prisma.mission.findFirst.mockResolvedValue(null);

      await expect(service.traiterAlerte("SUP-1", "al1")).rejects.toThrow(ForbiddenException);
    });

    it("refuse d'écrire à un agent hors de son équipe", async () => {
      await expect(service.envoyerMessage("SUP-1", { texte: "Salut", agentId: "etranger" })).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.messageSuperviseur.create).not.toHaveBeenCalled();
    });

    it("diffuse à toute l'équipe quand aucun agent n'est précisé", async () => {
      await service.envoyerMessage("SUP-1", { texte: " Consigne du jour " });

      expect(prisma.messageSuperviseur.create).toHaveBeenCalledWith({
        data: { superviseurId: "sup-1", agentId: null, texte: "Consigne du jour" },
      });
    });
  });

  describe("planifierReunion", () => {
    const demain = () => new Date(Date.now() + 86_400_000).toISOString();

    it("refuse une date passée", async () => {
      await expect(
        service.planifierReunion("SUP-1", { titre: "Point", debut: "2020-01-01T10:00:00Z", dureeMin: 30 })
      ).rejects.toThrow(BadRequestException);
    });

    it("refuse d'inviter un agent hors de son équipe", async () => {
      await expect(
        service.planifierReunion("SUP-1", { titre: "Point", debut: demain(), dureeMin: 30, agentIds: ["etranger"] })
      ).rejects.toThrow(ForbiddenException);
    });

    it("sans invités : réunion collective avec toute l'équipe, et un e-mail par agent", async () => {
      await service.planifierReunion("SUP-1", { titre: "Point d'équipe", debut: demain(), dureeMin: 45 });

      const data = prisma.reunionSuperviseur.create.mock.calls[0][0].data;
      expect(data.type).toBe("collective");
      expect(data.participants.create).toEqual([{ agentId: "ag-1" }, { agentId: "ag-2" }]);
      expect(email.send).toHaveBeenCalledTimes(2);
    });

    it("un seul invité : réunion individuelle", async () => {
      await service.planifierReunion("SUP-1", { titre: "Point", debut: demain(), dureeMin: 20, agentIds: ["ag-1"] });

      expect(prisma.reunionSuperviseur.create.mock.calls[0][0].data.type).toBe("individuelle");
    });
  });

  describe("rapportClientCsv", () => {
    it("refuse une période mal formée", async () => {
      await expect(service.rapportClientCsv("SUP-1", "2026-13")).rejects.toThrow(BadRequestException);
    });

    it("n'exporte que les journées validées, avec BOM et protection contre les formules", async () => {
      prisma.mission.findMany.mockResolvedValue([
        {
          agent: { prenom: "=Tiana", nom: "Test", matricule: "ETF-AG-1" },
          contrat: { clientNom: "Acme" },
          suivisJournaliers: [
            { jour: new Date("2026-10-05T00:00:00Z"), heuresTravaillees: 8, heuresPanne: 1, realise: 6, tauxAtteint: 6, commentaireSuperviseur: 'Panne "fibre"' },
          ],
        },
      ]);

      const out = await service.rapportClientCsv("SUP-1", "2026-10");

      expect(prisma.mission.findMany.mock.calls[0][0].include.suivisJournaliers.where.statutValidation).toBe("valide");
      expect(out.startsWith("﻿")).toBe(true);
      expect(out).toContain(`"'=Tiana Test"`);
      expect(out).toContain(`"Panne ""fibre"""`);
      expect(out).toContain(`"TOTAL"`);
    });
  });

  describe("regenererIdentifiants", () => {
    it("pose un mot de passe haché, coupe les sessions et envoie un e-mail", async () => {
      const r = await service.regenererIdentifiants("sup-1");

      const data = prisma.compteSuperviseur.upsert.mock.calls[0][0].update;
      expect(prisma.compteSuperviseur.upsert.mock.calls[0][0].create.superviseurId).toBe("sup-1");
      expect(data.password).toMatch(/^\$2[aby]\$/);
      expect(data.sessionsRevoqueesAt).toBeInstanceOf(Date);
      const envoye = email.send.mock.calls[0][0].text as string;
      const mdp = /Mot de passe temporaire : (\S+)/.exec(envoye)![1];
      expect(await bcrypt.compare(mdp, data.password)).toBe(true);
      expect(r).toEqual({ ok: true, emailEnvoye: true });
    });
  });
});
