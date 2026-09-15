import { NotFoundException } from "@nestjs/common";
import { RhService } from "./rh.service";
import { PrismaService } from "../prisma/prisma.service";
import { CockpitService } from "../cockpit/cockpit.service";
import { NotationService } from "../notation/notation.service";
import { EmailService } from "../common/email.service";

// Cette suite se concentre sur la logique métier réelle du RhService (calculs
// financiers, agrégations par période, règles de priorité) plutôt que sur
// les endpoints CRUD purs — voir la discussion du 2026-09-04 : c'est là que
// se cachent les régressions silencieuses (montants faux, période décalée)
// qui ont le plus d'impact en prod.

function makePrismaMock() {
  return {
    groupe: { findMany: jest.fn(), findUnique: jest.fn() },
    tarifFormation: { upsert: jest.fn() },
    encaissementFormation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    apprenant: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    formateur: { findMany: jest.fn(), findUnique: jest.fn() },
    paiementFormateur: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    seance: { findMany: jest.fn() },
    connecteur: { findMany: jest.fn(), findUnique: jest.fn() },
    evaluationAttempt: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    mission: { count: jest.fn() },
    agentAcquisition: { create: jest.fn(), findMany: jest.fn() },
    reinscription: { create: jest.fn() },
  };
}

describe("RhService", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let email: { send: jest.Mock };
  let service: RhService;

  beforeEach(() => {
    prisma = makePrismaMock();
    email = { send: jest.fn().mockResolvedValue({ delivered: true }) };
    service = new RhService(
      prisma as unknown as PrismaService,
      {} as unknown as CockpitService,
      {} as unknown as NotationService,
      email as unknown as EmailService
    );
  });

  // ---- Encaissements --------------------------------------------------

  describe("createEncaissement", () => {
    it("lève NotFoundException si l'apprenant n'existe pas", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      await expect(
        service.createEncaissement({ apprenantId: "x", montant: 100000, jour: "2026-03-05" })
      ).rejects.toThrow(NotFoundException);
      expect(prisma.encaissementFormation.create).not.toHaveBeenCalled();
    });

    it("normalise le jour à minuit UTC avant de créer l'encaissement", async () => {
      prisma.apprenant.findUnique.mockResolvedValue({ id: "app-1" });
      prisma.encaissementFormation.create.mockResolvedValue({});

      await service.createEncaissement({
        apprenantId: "app-1",
        montant: 150000,
        jour: "2026-03-05",
        moyenPaiement: "MVola",
      });

      const { data } = prisma.encaissementFormation.create.mock.calls[0][0];
      expect(data.jour.toISOString()).toBe("2026-03-05T00:00:00.000Z");
      expect(data.montant).toBe(150000);
      expect(data.moyenPaiement).toBe("MVola");
    });
  });

  describe("updateEncaissement", () => {
    it("lève NotFoundException si l'encaissement n'existe pas", async () => {
      prisma.encaissementFormation.findUnique.mockResolvedValue(null);
      await expect(
        service.updateEncaissement("e-1", {
          apprenantId: "app-1",
          montant: 100,
          jour: "2026-03-05",
        })
      ).rejects.toThrow(NotFoundException);
    });

    it("lève NotFoundException si l'apprenant n'existe pas", async () => {
      prisma.encaissementFormation.findUnique.mockResolvedValue({ id: "e-1" });
      prisma.apprenant.findUnique.mockResolvedValue(null);
      await expect(
        service.updateEncaissement("e-1", {
          apprenantId: "app-inconnu",
          montant: 100,
          jour: "2026-03-05",
        })
      ).rejects.toThrow(NotFoundException);
      expect(prisma.encaissementFormation.update).not.toHaveBeenCalled();
    });

    it("met à jour montant, jour, moyen de paiement et apprenant", async () => {
      prisma.encaissementFormation.findUnique.mockResolvedValue({ id: "e-1" });
      prisma.apprenant.findUnique.mockResolvedValue({ id: "app-1" });
      prisma.encaissementFormation.update.mockResolvedValue({ id: "e-1", montant: 200000 });

      await service.updateEncaissement("e-1", {
        apprenantId: "app-1",
        montant: 200000,
        jour: "2026-03-05",
        moyenPaiement: "MVola",
      });

      const { data } = prisma.encaissementFormation.update.mock.calls[0][0];
      expect(data.apprenantId).toBe("app-1");
      expect(data.montant).toBe(200000);
      expect(data.jour.toISOString()).toBe("2026-03-05T00:00:00.000Z");
      expect(data.moyenPaiement).toBe("MVola");
    });
  });

  describe("deleteEncaissement", () => {
    it("lève NotFoundException si l'encaissement n'existe pas", async () => {
      prisma.encaissementFormation.findUnique.mockResolvedValue(null);
      await expect(service.deleteEncaissement("e-1")).rejects.toThrow(NotFoundException);
      expect(prisma.encaissementFormation.delete).not.toHaveBeenCalled();
    });

    it("supprime l'encaissement existant", async () => {
      prisma.encaissementFormation.findUnique.mockResolvedValue({ id: "e-1" });
      prisma.encaissementFormation.delete.mockResolvedValue({ id: "e-1" });

      await service.deleteEncaissement("e-1");

      expect(prisma.encaissementFormation.delete).toHaveBeenCalledWith({ where: { id: "e-1" } });
    });
  });

  // ---- État financier Académie ------------------------------------------

  describe("getEtatFinancierFormation", () => {
    it("ignore les groupes sans typeCours et les apprenants inactifs, calcule CA/coût/marge sur 2 décimales", async () => {
      prisma.groupe.findMany.mockResolvedValue([
        {
          typeCours: "DELF DALF",
          apprenants: [{ statutAgent: "actif" }, { statutAgent: "actif" }, { statutAgent: "inactif" }],
        },
        {
          typeCours: "DELF DALF",
          apprenants: [{ statutAgent: "formation" }],
        },
      ]);
      prisma.tarifFormation.upsert.mockResolvedValue({ typeCours: "DELF DALF", prixFormation: 333333 });

      const result = await service.getEtatFinancierFormation();

      // 2 actifs + 1 formation (non "inactif") sur le 1er groupe + 1 sur le 2e = 3 actifs
      expect(result).toEqual([
        {
          typeCours: "DELF DALF",
          nbApprenantsActifs: 3,
          prixFormation: 333333,
          caTheorique: 999999,
          coutPrevu: 199999.8,
          beneficeNetEstaf: 799999.2,
        },
      ]);
    });

    it("get-or-create le tarif à 0 pour un type de cours jamais tarifé (jamais un montant inventé)", async () => {
      prisma.groupe.findMany.mockResolvedValue([
        { typeCours: "FOL", apprenants: [{ statutAgent: "actif" }] },
      ]);
      prisma.tarifFormation.upsert.mockResolvedValue({ typeCours: "FOL", prixFormation: 0 });

      const result = await service.getEtatFinancierFormation();

      expect(result[0].caTheorique).toBe(0);
      expect(prisma.tarifFormation.upsert).toHaveBeenCalledWith({
        where: { typeCours: "FOL" },
        create: { typeCours: "FOL", prixFormation: 0 },
        update: {},
      });
    });
  });

  // ---- Encaissements agrégés par type de cours ---------------------------

  describe("getEncaissementsFormation", () => {
    it("compte les inscrits actifs mais totalise TOUS les encaissements, même d'apprenants devenus inactifs entre-temps", async () => {
      prisma.groupe.findMany.mockResolvedValue([
        { typeCours: "TEF Canada", apprenants: [{ statutAgent: "inactif" }] }, // 0 actif
      ]);
      prisma.encaissementFormation.findMany.mockResolvedValue([
        { montant: 100000, apprenant: { groupe: { typeCours: "TEF Canada" } } },
        { montant: 50000, apprenant: { groupe: { typeCours: "TEF Canada" } } },
      ]);

      const result = await service.getEncaissementsFormation();

      expect(result).toEqual([{ typeCours: "TEF Canada", nbInscrits: 0, totalEncaisse: 150000 }]);
    });

    it("trie du type de cours le plus rentable au moins rentable", async () => {
      prisma.groupe.findMany.mockResolvedValue([]);
      prisma.encaissementFormation.findMany.mockResolvedValue([
        { montant: 100, apprenant: { groupe: { typeCours: "DFP" } } },
        { montant: 500, apprenant: { groupe: { typeCours: "FOL" } } },
        { montant: 300, apprenant: { groupe: { typeCours: "DELF DALF" } } },
      ]);

      const result = await service.getEncaissementsFormation();

      expect(result.map((r) => r.typeCours)).toEqual(["FOL", "DELF DALF", "DFP"]);
    });
  });

  // ---- Tendances hebdomadaire / mensuelle --------------------------------

  describe("getTendanceHebdomadaireFormation", () => {
    it("regroupe par semaine ISO en franchissant correctement la limite d'année (29-31 déc 2025 -> 2026-W01)", async () => {
      prisma.encaissementFormation.findMany.mockResolvedValue([
        { montant: 100, jour: new Date("2025-12-29T00:00:00Z") }, // lundi
        { montant: 50, jour: new Date("2025-12-31T00:00:00Z") }, // mercredi, même semaine ISO
        { montant: 25, jour: new Date("2026-01-01T00:00:00Z") }, // jeudi, même semaine ISO encore
      ]);

      const result = await service.getTendanceHebdomadaireFormation();

      expect(result).toEqual([{ semaine: "2026-W01", totalEncaisse: 175 }]);
    });

    it("ne garde que les 8 dernières semaines ayant un encaissement réel, triées croissant", async () => {
      // 10 lundis consécutifs, tous en 2026 pour rester loin de toute bascule d'année.
      const encaissements = Array.from({ length: 10 }, (_, i) => ({
        montant: i + 1,
        jour: new Date(Date.UTC(2026, 1, 2 + i * 7)), // lundis à partir du 2026-02-02
      }));
      prisma.encaissementFormation.findMany.mockResolvedValue(encaissements);

      const result = await service.getTendanceHebdomadaireFormation();

      expect(result).toHaveLength(8);
      // Croissant : la dernière entrée est la semaine la plus récente.
      expect(result[0].semaine < result[7].semaine).toBe(true);
      // Les 2 plus anciennes semaines (montant 1 et 2) ont bien été coupées.
      const totaux = result.map((r) => r.totalEncaisse);
      expect(totaux).not.toContain(1);
      expect(totaux).not.toContain(2);
    });
  });

  describe("getTendanceMensuelleFormation", () => {
    it("regroupe par mois et trie du plus ancien au plus récent, aucun mois fabriqué", async () => {
      prisma.encaissementFormation.findMany.mockResolvedValue([
        { montant: 100, jour: new Date(Date.UTC(2026, 2, 15)) }, // mars
        { montant: 50, jour: new Date(Date.UTC(2026, 0, 15)) }, // janvier
        { montant: 25, jour: new Date(Date.UTC(2026, 2, 20)) }, // mars encore
      ]);

      const result = await service.getTendanceMensuelleFormation();

      expect(result).toEqual([
        { periode: "2026-01", totalEncaisse: 50 },
        { periode: "2026-03", totalEncaisse: 125 },
      ]);
    });
  });

  // ---- Paie Formateurs ----------------------------------------------------

  describe("getTableauPaieFormateurs", () => {
    it("regroupe chaque formateur par le type de cours de son groupe (trié par clé) le plus prioritaire", async () => {
      prisma.formateur.findMany.mockResolvedValue([
        {
          id: "f-1",
          groupes: [
            { cle: "C", typeCours: "FOL" },
            { cle: "A", typeCours: "TEF Canada" }, // A < C -> c'est celui-là qui compte
          ],
        },
      ]);
      prisma.paiementFormateur.findUnique.mockResolvedValue(null);
      prisma.formateur.findUnique.mockResolvedValue({ id: "f-1", tarifFixe: 500000 });
      prisma.paiementFormateur.create.mockResolvedValue({
        montantBase: 500000,
        montantPrime: 0,
        retenue: 0,
        statut: "attente",
      });

      const result = await service.getTableauPaieFormateurs("2026-03");

      const tefBucket = result.find((r) => r.bucket === "TEF Canada");
      expect(tefBucket).toEqual({
        bucket: "TEF Canada",
        nbFormateurs: 1,
        netAPayerTotal: 500000,
        payes: 0,
        enAttente: 1,
      });
      const folBucket = result.find((r) => r.bucket === "FOL");
      expect(folBucket?.nbFormateurs).toBe(0);
    });

    it("un formateur sans groupe tombe dans 'Formation externe'", async () => {
      prisma.formateur.findMany.mockResolvedValue([{ id: "f-1", groupes: [] }]);
      prisma.paiementFormateur.findUnique.mockResolvedValue({
        montantBase: 100000,
        montantPrime: 20000,
        retenue: 5000,
        statut: "paye",
      });

      const result = await service.getTableauPaieFormateurs("2026-03");

      const bucket = result.find((r) => r.bucket === "Formation externe");
      expect(bucket).toEqual({
        bucket: "Formation externe",
        nbFormateurs: 1,
        netAPayerTotal: 115000, // 100000 + 20000 - 5000
        payes: 1,
        enAttente: 0,
      });
    });
  });

  describe("heuresGroupeSurPeriode (via getDetailPaieFormateurs)", () => {
    it("ne compte que les séances programmées dans le mois de la période demandée", async () => {
      prisma.formateur.findMany.mockResolvedValue([
        { id: "f-1", prenom: "Awa", nom: "Rakoto", matricule: "F-01", groupes: [{ id: "g-1", label: "Groupe A", cle: "A", typeCours: "FOL" }] },
      ]);
      // Seule la 2e séance (mars) doit compter — la 1re (février) et la 3e (avril) sont hors période.
      prisma.seance.findMany.mockImplementation(({ where }: any) => {
        const debut: Date = where.startAt.gte;
        const fin: Date = where.startAt.lt;
        const toutes = [
          { dureeMinutes: 120, startAt: new Date(Date.UTC(2026, 1, 15)) },
          { dureeMinutes: 90, startAt: new Date(Date.UTC(2026, 2, 10)) },
          { dureeMinutes: 60, startAt: new Date(Date.UTC(2026, 3, 1)) },
        ];
        return Promise.resolve(toutes.filter((s) => s.startAt >= debut && s.startAt < fin));
      });
      prisma.paiementFormateur.findUnique.mockResolvedValue({
        montantBase: 100000,
        montantPrime: 0,
        retenue: 0,
        statut: "attente",
        moyenPaiement: null,
        datePaiement: null,
      });

      const result = await service.getDetailPaieFormateurs("FOL", "2026-03");

      expect(result.lignes[0].heuresTotal).toBe(1.5); // 90 minutes
      expect(result.lignes[0].groupes[0].heuresEffectuees).toBe(1.5);
    });
  });

  describe("updatePaiementFormateur / payerFormateur / payerTousFormateurs", () => {
    it("updatePaiementFormateur lève NotFoundException si la ligne de paie n'existe pas", async () => {
      prisma.paiementFormateur.findUnique.mockResolvedValue(null);
      await expect(
        service.updatePaiementFormateur("f-1", "2026-03", { montantBase: 100 })
      ).rejects.toThrow(NotFoundException);
    });

    it("payerFormateur lève NotFoundException si la ligne de paie n'existe pas", async () => {
      prisma.paiementFormateur.findUnique.mockResolvedValue(null);
      await expect(service.payerFormateur("f-1", "2026-03")).rejects.toThrow(NotFoundException);
    });

    it("payerFormateur marque la ligne payée avec une date", async () => {
      prisma.paiementFormateur.findUnique.mockResolvedValue({ formateurId: "f-1", periode: "2026-03" });
      prisma.paiementFormateur.update.mockResolvedValue({});

      await service.payerFormateur("f-1", "2026-03");

      expect(prisma.paiementFormateur.update).toHaveBeenCalledWith({
        where: { formateurId_periode: { formateurId: "f-1", periode: "2026-03" } },
        data: { statut: "paye", datePaiement: expect.any(Date) },
      });
    });

    it("payerTousFormateurs ne repaie pas les formateurs déjà payés", async () => {
      prisma.formateur.findMany.mockResolvedValue([
        { id: "f-1", prenom: "A", nom: "A", matricule: "F-01", groupes: [] },
        { id: "f-2", prenom: "B", nom: "B", matricule: "F-02", groupes: [] },
      ]);
      const statutParFormateur: Record<string, string> = { "f-1": "paye", "f-2": "attente" };
      prisma.paiementFormateur.findUnique.mockImplementation(({ where }: any) => {
        const formateurId = where.formateurId_periode.formateurId as string;
        return Promise.resolve({
          montantBase: 1,
          montantPrime: 0,
          retenue: 0,
          statut: statutParFormateur[formateurId],
        });
      });
      prisma.paiementFormateur.updateMany.mockResolvedValue({ count: 1 });

      await service.payerTousFormateurs("Formation externe", "2026-03");

      expect(prisma.paiementFormateur.updateMany).toHaveBeenCalledWith({
        where: { formateurId: { in: ["f-2"] }, periode: "2026-03" },
        data: { statut: "paye", datePaiement: expect.any(Date) },
      });
    });
  });

  // ---- Traçabilité RH (coordonnées de paiement) --------------------------

  describe("updateApprenantRh", () => {
    it("lève NotFoundException si l'apprenant n'existe pas", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      await expect(service.updateApprenantRh("ETF-2026-0001", {})).rejects.toThrow(
        NotFoundException
      );
    });

    it("lève NotFoundException si le connecteurId fourni n'existe pas", async () => {
      prisma.apprenant.findUnique.mockResolvedValue({ matricule: "ETF-2026-0001" });
      prisma.connecteur.findUnique.mockResolvedValue(null);
      await expect(
        service.updateApprenantRh("ETF-2026-0001", { connecteurId: "c-1" })
      ).rejects.toThrow(NotFoundException);
    });

    it("lève NotFoundException si le groupeId fourni n'existe pas", async () => {
      prisma.apprenant.findUnique.mockResolvedValue({ matricule: "ETF-2026-0001" });
      prisma.groupe.findUnique.mockResolvedValue(null);
      await expect(
        service.updateApprenantRh("ETF-2026-0001", { groupeId: "g-inconnu" })
      ).rejects.toThrow(NotFoundException);
      expect(prisma.apprenant.update).not.toHaveBeenCalled();
    });

    it("réaffecte l'apprenant au groupe fourni — corrige une confirmation de paiement sur le mauvais groupe", async () => {
      prisma.apprenant.findUnique.mockResolvedValue({ matricule: "ETF-2026-0001" });
      prisma.groupe.findUnique.mockResolvedValue({ id: "g-2" });
      prisma.apprenant.update.mockResolvedValue({});

      await service.updateApprenantRh("ETF-2026-0001", { groupeId: "g-2" });

      expect(prisma.apprenant.update.mock.calls[0][0].data.groupeId).toBe("g-2");
    });

    it("horodate coordonneesVerifieesLe seulement si le RIB ou le moyen de paiement change", async () => {
      prisma.apprenant.findUnique.mockResolvedValue({ matricule: "ETF-2026-0001" });
      prisma.apprenant.update.mockResolvedValue({});

      await service.updateApprenantRh("ETF-2026-0001", { statutAgent: "actif" });

      expect(prisma.apprenant.update.mock.calls[0][0].data.coordonneesVerifieesLe).toBeUndefined();
    });

    it("horodate coordonneesVerifieesLe dès que ribOuMobileMoney est fourni", async () => {
      prisma.apprenant.findUnique.mockResolvedValue({ matricule: "ETF-2026-0001" });
      prisma.apprenant.update.mockResolvedValue({});

      await service.updateApprenantRh("ETF-2026-0001", { ribOuMobileMoney: "0341234567" });

      expect(prisma.apprenant.update.mock.calls[0][0].data.coordonneesVerifieesLe).toBeInstanceOf(
        Date
      );
    });
  });

  // ---- Envoi des résultats (mail / WhatsApp) -----------------------------

  describe("envoyerResultatsCandidat", () => {
    const attempt = {
      id: "attempt-1",
      totalScore: 82,
      tier: "placement_direct",
      candidat: { firstName: "Awa", email: "awa@example.com", phone: "0341234567" },
    };

    it("lève NotFoundException si la tentative n'existe pas", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue(null);
      await expect(
        service.envoyerResultatsCandidat("inconnu", { canal: "mail", modele: "dfp" })
      ).rejects.toThrow(NotFoundException);
    });

    it("canal 'mail' : envoie l'e-mail, ne renvoie pas de lien WhatsApp", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue(attempt);
      prisma.evaluationAttempt.update.mockResolvedValue({});

      const result = await service.envoyerResultatsCandidat("attempt-1", {
        canal: "mail",
        modele: "postulant_prod",
      });

      expect(email.send).toHaveBeenCalledTimes(1);
      expect(email.send.mock.calls[0][0].to).toBe("awa@example.com");
      expect(result.waLink).toBeUndefined();
      expect(result.message).toContain("82/100");
      expect(prisma.evaluationAttempt.update).toHaveBeenCalledWith({
        where: { id: "attempt-1" },
        data: {
          resultatsEnvoyesLe: expect.any(Date),
          resultatsCanal: "mail",
          resultatsModele: "postulant_prod",
        },
      });
    });

    it("canal 'whatsapp' : ne déclenche aucun envoi, convertit un numéro local (0...) en format international (261...)", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue(attempt);
      prisma.evaluationAttempt.update.mockResolvedValue({});

      const result = await service.envoyerResultatsCandidat("attempt-1", {
        canal: "whatsapp",
        modele: "dfp",
      });

      expect(email.send).not.toHaveBeenCalled();
      expect(result.waLink).toContain("https://wa.me/261341234567?text=");
    });

    it("laisse un numéro déjà au format international inchangé", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue({
        ...attempt,
        candidat: { ...attempt.candidat, phone: "+261341234567" },
      });
      prisma.evaluationAttempt.update.mockResolvedValue({});

      const result = await service.envoyerResultatsCandidat("attempt-1", {
        canal: "whatsapp",
        modele: "dfp",
      });

      expect(result.waLink).toContain("https://wa.me/261341234567?text=");
    });

    it("utilise 'en cours d'évaluation' quand le tier n'est pas encore défini", async () => {
      prisma.evaluationAttempt.findUnique.mockResolvedValue({
        ...attempt,
        tier: null,
        totalScore: null,
      });
      prisma.evaluationAttempt.update.mockResolvedValue({});

      const result = await service.envoyerResultatsCandidat("attempt-1", {
        canal: "mail",
        modele: "dfp",
      });

      expect(result.message).toContain("en cours d'évaluation");
      expect(result.message).toContain("—/100");
    });
  });

  // ---- Vue d'ensemble -----------------------------------------------------

  describe("getVueEnsemble", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it("calcule la croissance MTD des apporteurs, ne compte le vivier que sur les tiers niveau_c1/placement_direct", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-03-15T12:00:00Z"));

      prisma.apprenant.findMany
        // #1 : apprenants (liste complète, pour talentsEnVivier)
        .mockResolvedValueOnce([
          { evaluationAttempt: { tier: "niveau_c1" } },
          { evaluationAttempt: { tier: "formation_b1" } },
          { evaluationAttempt: null },
        ])
        // #2 : groupeId distincts (vaguesEnFormation)
        .mockResolvedValueOnce([{ groupeId: "g-1" }, { groupeId: "g-2" }])
        // #3 : apprenants FOL abonnés (abonnementsFolActifs)
        .mockResolvedValueOnce([{ id: "fol-1" }, { id: "fol-2" }]);
      prisma.evaluationAttempt.count.mockResolvedValue(5);
      prisma.connecteur.findMany.mockResolvedValue([
        { status: "actif", createdAt: new Date("2026-02-01") }, // avant ce mois
        { status: "actif", createdAt: new Date("2026-02-15") }, // avant ce mois
        { status: "inactif", createdAt: new Date("2026-02-20") }, // avant ce mois
        { status: "actif", createdAt: new Date("2026-01-01") }, // avant ce mois
        { status: "actif", createdAt: new Date("2026-03-10") }, // ce mois-ci (nouveau)
      ]);
      prisma.mission.count.mockResolvedValue(7);

      const result = await service.getVueEnsemble();

      expect(result).toEqual({
        talentsEnVivier: 1,
        agentsEnProductionActive: 7,
        vaguesEnFormation: 2,
        recrutementsEnCours: 5,
        apprenantsTotal: 3,
        partenairesActifs: 4,
        partenairesTotal: 5,
        apporteursNouveauxMTD: 1,
        apporteursGrowthPctMTD: 25, // 1 nouveau / 4 déjà là avant ce mois = 25%
        abonnementsFolActifs: 2,
      });
    });

    it("renvoie une croissance null (pas 0 ni Infinity) quand aucun apporteur n'existait avant ce mois", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-03-15T12:00:00Z"));

      prisma.apprenant.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.evaluationAttempt.count.mockResolvedValue(0);
      prisma.connecteur.findMany.mockResolvedValue([
        { status: "actif", createdAt: new Date("2026-03-10") }, // uniquement ce mois-ci
      ]);
      prisma.mission.count.mockResolvedValue(0);

      const result = await service.getVueEnsemble();

      expect(result.apporteursNouveauxMTD).toBe(1);
      expect(result.apporteursGrowthPctMTD).toBeNull();
    });
  });

  // ---- Registre -------------------------------------------------------------

  describe("getRegistre", () => {
    it("priorise 'En Production' sur le tier, distingue ensuite Certifié / En Formation", async () => {
      prisma.apprenant.findMany.mockResolvedValue([
        {
          matricule: "ETF-2026-0001",
          prenom: "Awa",
          nom: "Diallo",
          email: "awa@example.com",
          groupe: { label: "Groupe A" },
          evaluationAttempt: { tier: "formation_b1", gradedAt: new Date("2026-01-10") },
          missions: [{ dateFin: null, contrat: { clientNom: "Client X" } }],
        },
        {
          matricule: "ETF-2026-0002",
          prenom: "Ben",
          nom: "Rakoto",
          email: "ben@example.com",
          groupe: { label: "Groupe B" },
          evaluationAttempt: { tier: "placement_direct", gradedAt: new Date("2026-01-11") },
          missions: [{ dateFin: new Date("2026-02-01"), contrat: { clientNom: "Client Y" } }],
        },
        {
          matricule: "ETF-2026-0003",
          prenom: "Cie",
          nom: "Ravo",
          email: "cie@example.com",
          groupe: { label: "Groupe C" },
          evaluationAttempt: null,
          missions: [],
        },
      ]);

      const result = await service.getRegistre();

      expect(result.map((r) => r.statut)).toEqual(["En Production", "Certifié", "En Formation"]);
      expect(result[0].derniereMissionClient).toBe("Client X");
      expect(result[1].derniereMissionClient).toBe("Client Y");
      expect(result[2].derniereMissionClient).toBeNull();
    });
  });

  // ---- Suivi des Agents d'Acquisition ------------------------------------

  describe("getSuiviAgentsAcquisition", () => {
    it("calcule testés/convertis/réinscriptions et la commission (5€ par conversion et par réinscription)", async () => {
      prisma.agentAcquisition.findMany.mockResolvedValue([
        {
          id: "agent-1",
          nom: "Hery R.",
          candidats: [
            { firstName: "Awa", lastName: "Diallo" },
            { firstName: "Njaka", lastName: "R." },
            { firstName: "Tiana", lastName: "M." },
          ],
          apprenants: [
            { reinscriptions: [{}, {}] },
            { reinscriptions: [] },
          ],
        },
        {
          id: "agent-2",
          nom: "Voahangy L.",
          candidats: [],
          apprenants: [],
        },
      ]);

      const result = await service.getSuiviAgentsAcquisition();

      expect(result).toEqual([
        {
          id: "agent-1",
          nom: "Hery R.",
          nbTestes: 3,
          nbConvertis: 2,
          commissionConversion: 10,
          nbReinscriptions: 2,
          commissionReinscription: 10,
          filleuls: ["Awa Diallo", "Njaka R.", "Tiana M."],
        },
        {
          id: "agent-2",
          nom: "Voahangy L.",
          nbTestes: 0,
          nbConvertis: 0,
          commissionConversion: 0,
          nbReinscriptions: 0,
          commissionReinscription: 0,
          filleuls: [],
        },
      ]);
    });
  });

  describe("createAgentAcquisition", () => {
    it("crée l'agent avec le nom fourni", async () => {
      prisma.agentAcquisition.create.mockResolvedValue({ id: "agent-1", nom: "Hery R." });
      await service.createAgentAcquisition({ nom: "Hery R." });
      expect(prisma.agentAcquisition.create).toHaveBeenCalledWith({ data: { nom: "Hery R." } });
    });
  });

  describe("renouvelerAbonnement", () => {
    it("lève NotFoundException si l'apprenant n'existe pas", async () => {
      prisma.apprenant.findUnique.mockResolvedValue(null);
      await expect(
        service.renouvelerAbonnement("inconnu", { nouvelleEcheance: "2026-12-01" })
      ).rejects.toThrow(NotFoundException);
      expect(prisma.reinscription.create).not.toHaveBeenCalled();
    });

    it("journalise la réinscription et met à jour l'échéance de l'apprenant", async () => {
      prisma.apprenant.findUnique.mockResolvedValue({ id: "app-1", matricule: "ETF-2026-0001" });
      prisma.apprenant.update.mockResolvedValue({});

      await service.renouvelerAbonnement("ETF-2026-0001", { nouvelleEcheance: "2026-12-01" });

      expect(prisma.reinscription.create).toHaveBeenCalledWith({
        data: { apprenantId: "app-1", nouvelleEcheance: new Date("2026-12-01") },
      });
      expect(prisma.apprenant.update).toHaveBeenCalledWith({
        where: { matricule: "ETF-2026-0001" },
        data: { abonnementExpireAt: new Date("2026-12-01") },
      });
    });
  });
});
