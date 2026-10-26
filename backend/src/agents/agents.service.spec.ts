import * as bcrypt from "bcryptjs";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AgentsService } from "./agents.service";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { StorageService } from "../common/storage.service";

// Agent de production (compte du 2026-10-22). Ce que cette suite fige :
//   - la numérotation du matricule (préfixe distinct des apprenants et des
//     formateurs, sinon le login chercherait dans la mauvaise table) ;
//   - le mot de passe temporaire haché + envoyé une seule fois ;
//   - le relevé journalier : taux déduit du réalisé quand une cible existe ;
//   - les taux journalier/hebdo et le temps travaillé de l'Espace Agent ;
//   - la paie lue par l'agent = même net à payer que la RH.

function jour(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function makePrismaMock() {
  return {
    agent: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "agent-1", ...data })
      ),
      update: jest.fn(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "agent-1", ...data })
      ),
      delete: jest.fn().mockResolvedValue({}),
    },
    agentDocument: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    mission: { findFirst: jest.fn().mockResolvedValue(null), findUnique: jest.fn() },
    suiviAgentJournalier: {
      upsert: jest.fn(
        (args: { where: Record<string, any>; create: Record<string, unknown> }) =>
          Promise.resolve({ id: "rel-1", ...args.create })
      ),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    paiementAgent: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe("AgentsService", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let email: { send: jest.Mock };
  let storage: { uploadBuffer: jest.Mock; deleteObject: jest.Mock; getObjectStream: jest.Mock };
  let service: AgentsService;

  beforeEach(() => {
    prisma = makePrismaMock();
    email = { send: jest.fn().mockResolvedValue({ delivered: true }) };
    storage = {
      uploadBuffer: jest.fn().mockResolvedValue(undefined),
      deleteObject: jest.fn().mockResolvedValue(undefined),
      getObjectStream: jest.fn(),
    };
    service = new AgentsService(
      prisma as unknown as PrismaService,
      email as unknown as EmailService,
      storage as unknown as StorageService
    );
  });

  describe("createAgent", () => {
    const dto = { prenom: "Tiana", nom: "Randria", email: "tiana@example.com" };

    it("numérote le matricule à la suite du dernier agent de l'année", async () => {
      const annee = new Date().getFullYear();
      prisma.agent.findMany.mockResolvedValue([
        { matricule: `ETF-AG-${annee}-0001` },
        { matricule: `ETF-AG-${annee}-0007` },
        // Format inattendu : ignoré plutôt que de casser la numérotation.
        { matricule: `ETF-AG-${annee}-x` },
      ]);

      await service.createAgent(dto);

      const { data } = prisma.agent.create.mock.calls[0][0];
      expect(data.matricule).toBe(`ETF-AG-${annee}-0008`);
    });

    it("part de 0001 quand aucun agent n'existe encore", async () => {
      await service.createAgent(dto);
      const { data } = prisma.agent.create.mock.calls[0][0];
      expect(data.matricule).toBe(`ETF-AG-${new Date().getFullYear()}-0001`);
    });

    it("hache le mot de passe temporaire et l'envoie en clair une seule fois par e-mail", async () => {
      await service.createAgent(dto);

      const { data } = prisma.agent.create.mock.calls[0][0];
      expect(data.password).not.toBeNull();
      expect(data.statut).toBe("essai");

      const envoi = email.send.mock.calls[0][0];
      expect(envoi.to).toBe("tiana@example.com");
      // Le mot de passe en clair du mail est bien celui haché en base.
      const motDePasse = /Mot de passe temporaire : (\S+)/.exec(envoi.text)?.[1];
      expect(motDePasse).toBeDefined();
      expect(await bcrypt.compare(motDePasse as string, data.password as string)).toBe(true);
    });

    it("ne marque les coordonnées de paiement vérifiées que si elles sont fournies", async () => {
      await service.createAgent(dto);
      expect(prisma.agent.create.mock.calls[0][0].data.coordonneesVerifieesLe).toBeNull();

      await service.createAgent({ ...dto, moyenPaiementType: "MVola", ribOuMobileMoney: "034" });
      expect(prisma.agent.create.mock.calls[1][0].data.coordonneesVerifieesLe).toBeInstanceOf(Date);
    });
  });

  describe("updateAgent", () => {
    it("révoque les sessions quand l'agent passe à « inactif »", async () => {
      prisma.agent.findUnique.mockResolvedValue({ id: "agent-1", statut: "actif" });

      await service.updateAgent("agent-1", {
        prenom: "Tiana",
        nom: "Randria",
        email: "tiana@example.com",
        statut: "inactif",
      });

      expect(prisma.agent.update.mock.calls[0][0].data.sessionsRevoqueesAt).toBeInstanceOf(Date);
    });

    it("ne touche pas aux sessions quand le statut ne change pas", async () => {
      prisma.agent.findUnique.mockResolvedValue({ id: "agent-1", statut: "actif" });

      await service.updateAgent("agent-1", {
        prenom: "Tiana",
        nom: "Randria",
        email: "tiana@example.com",
        statut: "actif",
      });

      expect(prisma.agent.update.mock.calls[0][0].data.sessionsRevoqueesAt).toBeUndefined();
    });

    it("repasse les coordonnées de paiement en attente de vérification à chaque modification", async () => {
      prisma.agent.findUnique.mockResolvedValue({ id: "agent-1", statut: "actif" });

      await service.updateAgent("agent-1", {
        prenom: "Tiana",
        nom: "Randria",
        email: "tiana@example.com",
        ribOuMobileMoney: "034 00 000 00",
      });

      expect(prisma.agent.update.mock.calls[0][0].data.coordonneesVerifieesLe).toBeInstanceOf(Date);
    });
  });

  describe("regenerateCredentials", () => {
    it("refuse un agent inactif", async () => {
      prisma.agent.findUnique.mockResolvedValue({ id: "agent-1", statut: "inactif" });
      await expect(service.regenerateCredentials("agent-1")).rejects.toThrow(BadRequestException);
      expect(email.send).not.toHaveBeenCalled();
    });

    it("réémet un mot de passe et coupe les sessions existantes", async () => {
      prisma.agent.findUnique.mockResolvedValue({
        id: "agent-1",
        statut: "actif",
        prenom: "Tiana",
        email: "tiana@example.com",
        matricule: "ETF-AG-2026-0001",
      });

      await service.regenerateCredentials("agent-1");

      const { data } = prisma.agent.update.mock.calls[0][0];
      expect(data.sessionsRevoqueesAt).toBeInstanceOf(Date);
      const motDePasse = /Mot de passe temporaire : (\S+)/.exec(email.send.mock.calls[0][0].text)?.[1];
      expect(await bcrypt.compare(motDePasse as string, data.password as string)).toBe(true);
    });
  });

  describe("removeAgent", () => {
    it("refuse de supprimer un agent qui a déjà des missions", async () => {
      prisma.agent.findUnique.mockResolvedValue({
        id: "agent-1",
        missions: [{ id: "m-1" }],
        documents: [],
      });
      await expect(service.removeAgent("agent-1")).rejects.toThrow(BadRequestException);
      expect(prisma.agent.delete).not.toHaveBeenCalled();
    });

    it("supprime un compte créé par erreur et nettoie ses documents", async () => {
      prisma.agent.findUnique.mockResolvedValue({
        id: "agent-1",
        missions: [],
        documents: [{ storageKey: "agents/agent-1/contrat/1.pdf" }],
      });

      await service.removeAgent("agent-1");

      expect(storage.deleteObject).toHaveBeenCalledWith("agents/agent-1/contrat/1.pdf");
      expect(prisma.agent.delete).toHaveBeenCalledWith({ where: { id: "agent-1" } });
    });
  });

  describe("upsertSuiviJournalier", () => {
    it("déduit le taux d'atteinte du réalisé quand la mission a une cible journalière", async () => {
      prisma.mission.findUnique.mockResolvedValue({ id: "m-1", objectifJournalier: 40 });

      await service.upsertSuiviJournalier("m-1", {
        jour: "2026-10-20T09:30:00.000Z",
        realise: 30,
        heuresTravaillees: 8,
      });

      const { where, create } = prisma.suiviAgentJournalier.upsert.mock.calls[0][0];
      // Jour normalisé à minuit UTC : un seul relevé par jour.
      expect(where.missionId_jour.jour).toEqual(jour("2026-10-20"));
      expect(create.tauxAtteint).toBe(75);
    });

    it("accepte un taux saisi directement quand aucune cible n'est fixée", async () => {
      prisma.mission.findUnique.mockResolvedValue({ id: "m-1", objectifJournalier: null });

      await service.upsertSuiviJournalier("m-1", { jour: "2026-10-20", tauxAtteint: 92 });

      expect(prisma.suiviAgentJournalier.upsert.mock.calls[0][0].create.tauxAtteint).toBe(92);
    });

    it("refuse une saisie sans cible ni taux plutôt que d'inventer un objectif", async () => {
      prisma.mission.findUnique.mockResolvedValue({ id: "m-1", objectifJournalier: null });

      await expect(
        service.upsertSuiviJournalier("m-1", { jour: "2026-10-20", realise: 30 })
      ).rejects.toThrow(BadRequestException);
    });

    it("rejette une mission inconnue", async () => {
      prisma.mission.findUnique.mockResolvedValue(null);
      await expect(
        service.upsertSuiviJournalier("inconnue", { jour: "2026-10-20", tauxAtteint: 50 })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getDashboard", () => {
    function agentAvecMission(overrides: Record<string, unknown> = {}) {
      return {
        id: "agent-1",
        matricule: "ETF-AG-2026-0001",
        prenom: "Tiana",
        nom: "Randria",
        email: "tiana@example.com",
        telephone: null,
        poste: "Téléopérateur",
        statut: "actif",
        dateEmbauche: jour("2026-09-01"),
        salaireBase: 500000,
        moyenPaiementType: null,
        ribOuMobileMoney: null,
        coordonneesVerifieesLe: null,
        documents: [],
        missions: [
          {
            id: "m-1",
            contrat: { clientNom: "Client A" },
            superviseur: { prenom: "Rina", nom: "B." },
            role: "Closer",
            dateDebut: jour("2026-09-01"),
            dateFin: null,
            qualityScore: 4,
            tarifNegocie: 600000,
            objectifJournalier: 40,
            objectifHebdo: 200,
            suivisHebdo: [],
            suivisJournaliers: [
              // Semaine ISO 2026-W42 (lundi 12 octobre).
              { jour: jour("2026-10-12"), realise: 40, tauxAtteint: 100, heuresTravaillees: 8 },
              { jour: jour("2026-10-13"), realise: 20, tauxAtteint: 50, heuresTravaillees: 6 },
              // Semaine précédente.
              { jour: jour("2026-10-05"), realise: 60, tauxAtteint: 150, heuresTravaillees: 9 },
            ],
          },
        ],
        ...overrides,
      };
    }

    it("expose la mission active, les cibles et la série journalière chronologique", async () => {
      prisma.agent.findUnique.mockResolvedValue(agentAvecMission());

      const data = await service.getDashboard("ETF-AG-2026-0001");

      expect(data.mission).toMatchObject({
        clientNom: "Client A",
        role: "Closer",
        active: true,
        objectifJournalier: 40,
        objectifHebdo: 200,
        superviseurNom: "Rina B.",
      });
      expect(data.tauxJournaliers.map((r) => r.tauxAtteint)).toEqual([150, 100, 50]);
    });

    it("calcule le taux hebdo sur la cible hebdo quand le réalisé est connu", async () => {
      prisma.agent.findUnique.mockResolvedValue(agentAvecMission());

      const { comparatifHebdo } = await service.getDashboard("ETF-AG-2026-0001");

      const w42 = comparatifHebdo.find((s) => s.semaine === "2026-W42");
      // 40 + 20 réalisés sur une cible de 200 = 30%.
      expect(w42).toMatchObject({ realise: 60, tauxAtteint: 30, joursSaisis: 2 });
      expect(w42?.heuresTravaillees).toBe(14);
    });

    it("retombe sur la moyenne des taux journaliers quand aucune cible hebdo n'est fixée", async () => {
      const agent = agentAvecMission();
      (agent.missions[0] as Record<string, unknown>).objectifHebdo = null;
      prisma.agent.findUnique.mockResolvedValue(agent);

      const { comparatifHebdo } = await service.getDashboard("ETF-AG-2026-0001");

      expect(comparatifHebdo.find((s) => s.semaine === "2026-W42")?.tauxAtteint).toBe(75);
    });

    it("totalise le temps travaillé et la synthèse des objectifs", async () => {
      prisma.agent.findUnique.mockResolvedValue(agentAvecMission());

      const { tempsTravaille, synthese } = await service.getDashboard("ETF-AG-2026-0001");

      expect(tempsTravaille.heuresTotal).toBe(23);
      expect(tempsTravaille.joursTravailles).toBe(3);
      expect(tempsTravaille.moyenneHeuresParJour).toBe(7.67);
      expect(synthese).toEqual({ joursSaisis: 3, tauxMoyen: 100, joursObjectifAtteint: 2 });
    });

    it("affiche la dernière mission close quand l'agent n'est plus staffé", async () => {
      const agent = agentAvecMission();
      (agent.missions[0] as Record<string, unknown>).dateFin = jour("2026-10-15");
      prisma.agent.findUnique.mockResolvedValue(agent);

      const data = await service.getDashboard("ETF-AG-2026-0001");

      expect(data.mission).toMatchObject({ active: false });
    });

    it("reste honnête quand aucune mission n'existe (pas de chiffre inventé)", async () => {
      prisma.agent.findUnique.mockResolvedValue(agentAvecMission({ missions: [] }));

      const data = await service.getDashboard("ETF-AG-2026-0001");

      expect(data.mission).toBeNull();
      expect(data.tauxJournaliers).toEqual([]);
      expect(data.comparatifHebdo).toEqual([]);
      expect(data.synthese).toEqual({ joursSaisis: 0, tauxMoyen: null, joursObjectifAtteint: 0 });
      expect(data.pointageHebdo).toBeNull();
    });

    it("rejette un matricule inconnu", async () => {
      prisma.agent.findUnique.mockResolvedValue(null);
      await expect(service.getDashboard("inconnu")).rejects.toThrow(NotFoundException);
    });
  });

  describe("getPaiements", () => {
    beforeEach(() => {
      prisma.agent.findUnique.mockResolvedValue({
        id: "agent-1",
        matricule: "ETF-AG-2026-0001",
        prenom: "Tiana",
        nom: "Randria",
        email: "tiana@example.com",
        telephone: null,
        poste: null,
        statut: "actif",
        dateEmbauche: null,
        salaireBase: 500000,
        moyenPaiementType: "MVola",
        ribOuMobileMoney: "034 00 000 00",
        coordonneesVerifieesLe: jour("2026-10-01"),
        documents: [],
        missions: [
          {
            id: "m-1",
            contrat: { clientNom: "Client A" },
            superviseur: null,
            role: "Closer",
            dateDebut: jour("2026-09-01"),
            dateFin: null,
            qualityScore: 4,
            tarifNegocie: 600000,
            objectifJournalier: null,
            objectifHebdo: null,
            suivisJournaliers: [],
            suivisHebdo: [
              {
                semaine: "2026-W37", // lundi 2026-09-07 → mois 2026-09
                heuresAbsenceNonJustifiee: 2,
                heuresRetardCumulees: 1,
                heuresSupValidees: 3,
              },
            ],
          },
        ],
      });
    });

    it("applique la même formule de net à payer que la RH", async () => {
      prisma.paiementAgent.findMany.mockResolvedValue([
        {
          missionId: "m-1",
          periode: "2026-09",
          montantBase: 600000,
          montantPrime: 50000,
          moyenPaiement: "MVola",
          statut: "paye",
          datePaiement: jour("2026-10-05"),
        },
      ]);

      const { lignes, totalPaye, totalEnAttente } = await service.getPaiements("ETF-AG-2026-0001");

      const tauxHoraire = Math.round((600000 / 173.33) * 100) / 100;
      expect(lignes[0].retenue).toBe(Math.round(tauxHoraire * 3 * 100) / 100);
      expect(lignes[0].primeHeuresSup).toBe(Math.round(tauxHoraire * 3 * 1.5 * 100) / 100);
      expect(lignes[0].netAPayer).toBe(
        Math.round((600000 - lignes[0].retenue + lignes[0].primeHeuresSup + 50000) * 100) / 100
      );
      expect(lignes[0].clientNom).toBe("Client A");
      expect(totalPaye).toBe(lignes[0].netAPayer);
      expect(totalEnAttente).toBe(0);
    });

    it("ne matérialise aucune ligne de paie (lecture seule côté agent)", async () => {
      prisma.paiementAgent.findMany.mockResolvedValue([]);

      const { lignes, totalPaye, totalEnAttente } = await service.getPaiements("ETF-AG-2026-0001");

      expect(lignes).toEqual([]);
      expect(totalPaye).toBe(0);
      expect(totalEnAttente).toBe(0);
    });
  });

  describe("getMonDocumentStream", () => {
    it("refuse le document d'un autre agent", async () => {
      prisma.agentDocument.findUnique.mockResolvedValue({
        id: "doc-1",
        storageKey: "agents/agent-2/contrat/1.pdf",
        agent: { matricule: "ETF-AG-2026-0002" },
      });

      await expect(
        service.getMonDocumentStream("ETF-AG-2026-0001", "doc-1")
      ).rejects.toThrow(NotFoundException);
      expect(storage.getObjectStream).not.toHaveBeenCalled();
    });

    it("sert le document de l'agent connecté", async () => {
      prisma.agentDocument.findUnique.mockResolvedValue({
        id: "doc-1",
        storageKey: "agents/agent-1/contrat/1.pdf",
        agent: { matricule: "ETF-AG-2026-0001" },
      });

      await service.getMonDocumentStream("ETF-AG-2026-0001", "doc-1");

      expect(storage.getObjectStream).toHaveBeenCalledWith("agents/agent-1/contrat/1.pdf");
    });
  });
});
