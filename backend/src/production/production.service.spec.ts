import { ProductionService } from "./production.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage.service";

// Ces deux méthodes (getDetailPaieAgents, getDetailPoolSuperviseurs) font un
// "get-or-create" par ligne (une requête DB par mission / par superviseur /
// par couple superviseur-contrat) — un vrai N+1, repéré lors de l'audit
// perf du 2026-09-21. Cette suite fige leur comportement AVANT le
// regroupement des requêtes (voir refactor qui suit), pour garantir que les
// montants calculés (paie réelle) restent identiques après coup. Les fakes
// ci-dessous simulent une table en mémoire indifféremment interrogée via
// findUnique/create (implémentation actuelle) ou findMany/createMany
// (implémentation groupée) : la suite doit rester verte des deux côtés du
// refactor sans être réécrite.

function makeUniqueStore(uniqueKeys: string[], initial: Record<string, unknown>[] = []) {
  const rows = [...initial];
  let idCounter = 0;

  function matches(row: Record<string, unknown>, criteria: Record<string, unknown>): boolean {
    return uniqueKeys.every((k) => row[k] === criteria[k]);
  }

  return {
    rows,
    findUnique: jest.fn(({ where }: { where: Record<string, unknown> }) => {
      const compound = Object.values(where)[0] as Record<string, unknown>;
      return Promise.resolve(rows.find((r) => matches(r, compound)) ?? null);
    }),
    findMany: jest.fn(({ where }: { where: Record<string, any> }) => {
      return Promise.resolve(
        rows.filter((r) => {
          return Object.entries(where).every(([key, cond]) => {
            if (cond && typeof cond === "object" && "in" in cond) {
              return (cond.in as unknown[]).includes(r[key]);
            }
            return r[key] === cond;
          });
        })
      );
    }),
    create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
      const row = { id: `row-${++idCounter}`, statut: "en_attente", datePaiement: null, ...data };
      rows.push(row);
      return Promise.resolve(row);
    }),
    createMany: jest.fn(({ data, skipDuplicates }: { data: Record<string, unknown>[]; skipDuplicates?: boolean }) => {
      let count = 0;
      for (const d of data) {
        const exists = rows.some((r) => matches(r, d));
        if (exists && skipDuplicates) continue;
        rows.push({ id: `row-${++idCounter}`, statut: "en_attente", datePaiement: null, ...d });
        count++;
      }
      return Promise.resolve({ count });
    }),
  };
}

function makePrismaMock() {
  return {
    mission: { findMany: jest.fn() },
    superviseur: { findMany: jest.fn() },
    paiementAgent: makeUniqueStore(["missionId", "periode"]),
    performanceSuperviseurClient: makeUniqueStore(["superviseurId", "contratId", "periode"]),
    paiementSuperviseur: makeUniqueStore(["superviseurId", "periode"]),
  };
}

describe("ProductionService — paie (get-or-create groupé, ex-N+1)", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let service: ProductionService;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new ProductionService(
      prisma as unknown as PrismaService,
      {} as unknown as StorageService
    );
  });

  describe("getDetailPaieAgents", () => {
    function mission(overrides: Record<string, unknown> = {}) {
      return {
        id: "mission-1",
        apprenant: {
          prenom: "Fara",
          nom: "R.",
          matricule: "ETF-2026-0001",
          moyenPaiementType: null,
          ribOuMobileMoney: null,
          coordonneesVerifieesLe: null,
        },
        contrat: { clientNom: "Client A" },
        superviseur: null,
        tarifNegocie: 600000,
        qualityScore: 4,
        suivisHebdo: [],
        ...overrides,
      };
    }

    it("crée une ligne par défaut pour une mission sans paie existante", async () => {
      prisma.mission.findMany.mockResolvedValue([mission()]);

      const { periode, lignes } = await service.getDetailPaieAgents("2026-09");

      expect(periode).toBe("2026-09");
      expect(lignes).toHaveLength(1);
      const l = lignes[0];
      expect(l.missionId).toBe("mission-1");
      expect(l.agentNom).toBe("Fara R.");
      expect(l.montantBase).toBe(600000);
      // primeSuggeree basée sur qualityScore (4/5) faute de CA réalisé —
      // primePct = poids "primes_performance" du budget (10/90 * 80%).
      expect(l.montantPrime).toBeGreaterThan(0);
      expect(l.netAPayer).toBe(round2(l.montantBase + l.montantPrime));
      expect(prisma.paiementAgent.rows).toHaveLength(1);
    });

    it("réutilise une ligne de paie déjà corrigée par la RH sans l'écraser", async () => {
      prisma.mission.findMany.mockResolvedValue([mission()]);
      prisma.paiementAgent.rows.push({
        id: "pa-existing",
        missionId: "mission-1",
        periode: "2026-09",
        montantBase: 700000, // corrigé manuellement, différent du tarifNegocie
        montantPrime: 50000,
        statut: "paye",
        datePaiement: new Date("2026-09-05"),
      });

      const { lignes } = await service.getDetailPaieAgents("2026-09");

      expect(lignes[0].montantBase).toBe(700000);
      expect(lignes[0].montantPrime).toBe(50000);
      expect(lignes[0].statut).toBe("paye");
      // Une seule ligne au total : la ligne existante n'a pas été dupliquée.
      expect(prisma.paiementAgent.rows).toHaveLength(1);
    });

    it("déduit retenue et prime heures sup à partir du pointage du mois de paie", async () => {
      prisma.mission.findMany.mockResolvedValue([
        mission({
          suivisHebdo: [
            {
              semaine: "2026-W37", // lundi 2026-09-07 → mois 2026-09
              heuresAbsenceNonJustifiee: 2,
              heuresRetardCumulees: 1,
              heuresSupValidees: 3,
              caRealise: 0,
            },
          ],
        }),
      ]);

      const { lignes } = await service.getDetailPaieAgents("2026-09");

      const tauxHoraire = round2(600000 / 173.33);
      expect(lignes[0].retenue).toBe(round2(tauxHoraire * (2 + 1)));
      expect(lignes[0].primeHeuresSup).toBe(round2(tauxHoraire * 3 * 1.5));
      expect(lignes[0].netAPayer).toBe(
        round2(lignes[0].montantBase - lignes[0].retenue + lignes[0].primeHeuresSup + lignes[0].montantPrime)
      );
    });

    it("traite correctement plusieurs missions en un seul appel", async () => {
      prisma.mission.findMany.mockResolvedValue([
        mission({ id: "mission-1" }),
        mission({ id: "mission-2", tarifNegocie: 400000, qualityScore: 3 }),
      ]);

      const { lignes } = await service.getDetailPaieAgents("2026-09");

      expect(lignes.map((l) => l.missionId).sort()).toEqual(["mission-1", "mission-2"]);
      expect(prisma.paiementAgent.rows).toHaveLength(2);
    });

    it("expose les coordonnées de paiement seulement si RIB/Mobile Money renseignés", async () => {
      prisma.mission.findMany.mockResolvedValue([
        mission({
          apprenant: {
            prenom: "Fara",
            nom: "R.",
            matricule: "ETF-2026-0001",
            moyenPaiementType: "MVola",
            ribOuMobileMoney: "034 00 000 00",
            coordonneesVerifieesLe: new Date("2026-08-01"),
          },
        }),
      ]);

      const { lignes } = await service.getDetailPaieAgents("2026-09");

      expect(lignes[0].coordonneesPaiement).toEqual({
        type: "MVola",
        numero: "034 00 000 00",
        verifieLe: new Date("2026-08-01"),
      });
    });
  });

  describe("getDetailPoolSuperviseurs", () => {
    function superviseur(overrides: Record<string, unknown> = {}) {
      return {
        id: "sup-1",
        matricule: "ETF-SUP-2026-0001",
        prenom: "Nirina",
        nom: "R.",
        tarifFixe: 500000,
        moyenPaiementType: null,
        ribOuMobileMoney: null,
        coordonneesVerifieesLe: null,
        missions: [],
        ...overrides,
      };
    }

    it("crée performance et paiement par défaut pour un superviseur sans historique", async () => {
      prisma.superviseur.findMany.mockResolvedValue([
        superviseur({
          missions: [{ contratId: "contrat-1", contrat: { clientNom: "Client A" }, qualityScore: 4, tarifNegocie: 600000 }],
        }),
      ]);

      const [ligne] = await service.getDetailPoolSuperviseurs("2026-09");

      expect(ligne.superviseurId).toBe("sup-1");
      expect(ligne.clientsDetail).toHaveLength(1);
      expect(ligne.clientsDetail[0].tauxPerformance).toBe(80); // (4/5)*100
      expect(ligne.montantFixe).toBe(500000);
      expect(ligne.netAPayer).toBe(round2(500000 + ligne.totalPrimes));
      expect(prisma.performanceSuperviseurClient.rows).toHaveLength(1);
      expect(prisma.paiementSuperviseur.rows).toHaveLength(1);
    });

    it("agrège plusieurs missions du même contrat avant de calculer la prime", async () => {
      prisma.superviseur.findMany.mockResolvedValue([
        superviseur({
          missions: [
            { contratId: "contrat-1", contrat: { clientNom: "Client A" }, qualityScore: 4, tarifNegocie: 300000 },
            { contratId: "contrat-1", contrat: { clientNom: "Client A" }, qualityScore: 2, tarifNegocie: 300000 },
          ],
        }),
      ]);

      const [ligne] = await service.getDetailPoolSuperviseurs("2026-09");

      expect(ligne.clientsDetail).toHaveLength(1);
      expect(ligne.clientsDetail[0].tauxPerformance).toBe(60); // moyenne (4+2)/2=3 → 60%
    });

    it("distingue les contrats d'un même superviseur (double équipe)", async () => {
      prisma.superviseur.findMany.mockResolvedValue([
        superviseur({
          missions: [
            { contratId: "contrat-1", contrat: { clientNom: "Client A" }, qualityScore: 4, tarifNegocie: 300000 },
            { contratId: "contrat-2", contrat: { clientNom: "Client B" }, qualityScore: 5, tarifNegocie: 300000 },
          ],
        }),
      ]);

      const [ligne] = await service.getDetailPoolSuperviseurs("2026-09");

      expect(ligne.clientsDetail.map((c: { contratId: string }) => c.contratId).sort()).toEqual([
        "contrat-1",
        "contrat-2",
      ]);
    });

    it("ne réécrit pas une performance ou un paiement déjà corrigés par la RH", async () => {
      prisma.superviseur.findMany.mockResolvedValue([
        superviseur({
          missions: [{ contratId: "contrat-1", contrat: { clientNom: "Client A" }, qualityScore: 4, tarifNegocie: 600000 }],
        }),
      ]);
      prisma.performanceSuperviseurClient.rows.push({
        id: "perf-existing",
        superviseurId: "sup-1",
        contratId: "contrat-1",
        periode: "2026-09",
        tauxPerformance: 95,
        prime: 999999,
      });
      prisma.paiementSuperviseur.rows.push({
        id: "pay-existing",
        superviseurId: "sup-1",
        periode: "2026-09",
        montantFixe: 550000,
        statut: "paye",
        datePaiement: new Date("2026-09-03"),
      });

      const [ligne] = await service.getDetailPoolSuperviseurs("2026-09");

      expect(ligne.clientsDetail[0].tauxPerformance).toBe(95);
      expect(ligne.clientsDetail[0].prime).toBe(999999);
      expect(ligne.montantFixe).toBe(550000);
      expect(ligne.statut).toBe("paye");
      expect(prisma.performanceSuperviseurClient.rows).toHaveLength(1);
      expect(prisma.paiementSuperviseur.rows).toHaveLength(1);
    });
  });
});

// Mêmes ratios que POSTES_BUDGET côté service (RATIOS_POSTES / RATIO_TOTAL,
// non exportés) — recalculés ici plutôt que dupliqués en dur, pour que ces
// tests restent corrects si le barème change.
const RATIO_TOTAL_FIXTURE = 50 + 7.5 + 7.5 + 5 + 10 + 10;
const PCT_APPORTEURS = (5 / RATIO_TOTAL_FIXTURE) * 0.8;
const PCT_DEMARRAGE = (10 / RATIO_TOTAL_FIXTURE) * 0.8;

function connecteurFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "con-1",
    firstName: "Rina",
    lastName: "Rakoto",
    apprenantsApportes: [
      {
        id: "ap-1",
        prenom: "Jean",
        nom: "Rabe",
        matricule: "ETF-1",
        missions: [{ id: "mission-1", tarifNegocie: 500000, contrat: { clientNom: "Client X" } }],
      },
    ],
    ...overrides,
  };
}

describe("ProductionService — commissions apporteurs", () => {
  function makeCommissionsPrismaMock() {
    return {
      connecteur: { findMany: jest.fn() },
      contratB2B: { findMany: jest.fn() },
      commissionDemarrageApporteur: makeUniqueStore(["contratId"]),
      paiementAgent: makeUniqueStore(["missionId", "periode"]),
    };
  }

  let prisma: ReturnType<typeof makeCommissionsPrismaMock>;
  let service: ProductionService;

  beforeEach(() => {
    prisma = makeCommissionsPrismaMock();
    service = new ProductionService(
      prisma as unknown as PrismaService,
      {} as unknown as StorageService
    );
  });

  describe("getCommissionsApporteurs", () => {
    it("transmet le filtre connecteurId à la requête Prisma", async () => {
      prisma.connecteur.findMany.mockImplementation(
        ({ where }: { where?: { id?: string } }) => {
          const all = [connecteurFixture()];
          return Promise.resolve(where?.id ? all.filter((c) => c.id === where.id) : all);
        }
      );

      await service.getCommissionsApporteurs("2026-09", "con-1");

      expect(prisma.connecteur.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "con-1" } })
      );
    });

    it("calcule la masse salariale et la commission à partir du tarifNegocie en l'absence de PaiementAgent pour la période", async () => {
      prisma.connecteur.findMany.mockResolvedValue([connecteurFixture()]);

      const [row] = await service.getCommissionsApporteurs("2026-09");

      expect(row.masseSalariale).toBe(500000);
      expect(row.commission).toBe(round2(500000 * PCT_APPORTEURS));
    });

    it("ignore les connecteurs sans aucun agent actuellement en mission", async () => {
      prisma.connecteur.findMany.mockResolvedValue([
        connecteurFixture({ apprenantsApportes: [] }),
      ]);

      const rows = await service.getCommissionsApporteurs("2026-09");

      expect(rows).toHaveLength(0);
    });
  });

  describe("getCommissionsDemarrage", () => {
    function contratFixture(overrides: Record<string, unknown> = {}) {
      return {
        id: "contrat-1",
        clientNom: "Client X",
        connecteurId: "con-1",
        tarifMensuel: 1000000,
        connecteur: { firstName: "Rina", lastName: "Rakoto" },
        commissionDemarrage: null,
        ...overrides,
      };
    }

    it("transmet le filtre connecteurId et crée la commission (groupée) si elle n'existe pas encore", async () => {
      prisma.contratB2B.findMany.mockImplementation(
        ({ where }: { where?: { connecteurId?: unknown } }) => {
          const all = [contratFixture()];
          return Promise.resolve(
            where?.connecteurId && typeof where.connecteurId === "string"
              ? all.filter((c) => c.connecteurId === where.connecteurId)
              : all
          );
        }
      );

      const [row] = await service.getCommissionsDemarrage("con-1");

      expect(prisma.contratB2B.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { connecteurId: "con-1" } })
      );
      expect(prisma.commissionDemarrageApporteur.createMany).toHaveBeenCalledWith({
        data: [{ contratId: "contrat-1", connecteurId: "con-1", montant: round2(1000000 * PCT_DEMARRAGE) }],
        skipDuplicates: true,
      });
      expect(row.montant).toBe(round2(1000000 * PCT_DEMARRAGE));
      expect(row.statut).toBe("en_attente");
    });

    it("réutilise la commission déjà matérialisée sans en recréer une autre (pas de createMany)", async () => {
      prisma.contratB2B.findMany.mockResolvedValue([
        contratFixture({
          commissionDemarrage: {
            id: "cda-existante",
            montant: 99999,
            statut: "paye",
            datePaiement: new Date("2026-09-01"),
          },
        }),
      ]);
      prisma.commissionDemarrageApporteur.rows.push({
        id: "cda-existante",
        contratId: "contrat-1",
        connecteurId: "con-1",
        montant: 99999,
        statut: "paye",
        datePaiement: new Date("2026-09-01"),
      });

      const [row] = await service.getCommissionsDemarrage("con-1");

      expect(prisma.commissionDemarrageApporteur.createMany).not.toHaveBeenCalled();
      expect(row.montant).toBe(99999);
      expect(row.statut).toBe("paye");
    });

    it("regroupe plusieurs contrats sans commission en un seul createMany (pas un create par contrat)", async () => {
      prisma.contratB2B.findMany.mockResolvedValue([
        contratFixture({ id: "contrat-1" }),
        contratFixture({ id: "contrat-2", clientNom: "Client Y" }),
      ]);

      const rows = await service.getCommissionsDemarrage();

      expect(prisma.commissionDemarrageApporteur.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.commissionDemarrageApporteur.createMany.mock.calls[0][0].data).toHaveLength(2);
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.contratId)).toEqual(["contrat-1", "contrat-2"]);
    });
  });

  describe("getCommissionRecurrenteCumulee", () => {
    it("ventile le cumul payé / en attente sur toutes les périodes historiques", async () => {
      prisma.paiementAgent.findMany = jest.fn().mockResolvedValue([
        { missionId: "m-1", periode: "2026-08", montantBase: 400000, statut: "paye" },
        { missionId: "m-1", periode: "2026-09", montantBase: 500000, statut: "en_attente" },
      ]);

      const result = await service.getCommissionRecurrenteCumulee("con-1");

      expect(prisma.paiementAgent.findMany).toHaveBeenCalledWith({
        where: { mission: { apprenant: { connecteurId: "con-1" } } },
      });
      expect(result.montantPaye).toBe(round2(400000 * PCT_APPORTEURS));
      expect(result.montantEnAttente).toBe(round2(500000 * PCT_APPORTEURS));
    });

    it("renvoie des cumuls nuls quand ce partenaire n'a aucun agent payé", async () => {
      prisma.paiementAgent.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.getCommissionRecurrenteCumulee("con-1");

      expect(result).toEqual({ montantPaye: 0, montantEnAttente: 0 });
    });
  });
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
