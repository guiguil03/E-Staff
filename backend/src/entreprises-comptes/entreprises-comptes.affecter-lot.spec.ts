/* eslint-disable @typescript-eslint/no-explicit-any */
import { NotFoundException } from "@nestjs/common";
import { EntreprisesComptesService } from "./entreprises-comptes.service";

// Affectation RH en lot : une mission par profil coché, échecs isolés.

const DTO = {
  contratId: "c1",
  superviseurId: "s1",
  role: "Closer",
  dateDebut: "2026-12-01",
};

function build(interets: Record<string, any>, contrat: any = { id: "c1", entrepriseId: "e1" }) {
  const createMission = jest.fn().mockResolvedValue({});
  const update = jest.fn().mockResolvedValue({});
  const prisma: Record<string, any> = {
    contratB2B: { findUnique: jest.fn().mockResolvedValue(contrat) },
    interetVivier: {
      findUnique: jest.fn(({ where }: any) => Promise.resolve(interets[where.id] ?? null)),
      update,
    },
  };
  const service = new EntreprisesComptesService(prisma as never, {} as never, {} as never, {} as never, { createMission } as never);
  return { service, createMission, update };
}

describe("EntreprisesComptesService.affecterLot", () => {
  it("crée une mission par profil avec les mêmes paramètres et passe l'intérêt en 'affecte'", async () => {
    const { service, createMission, update } = build({
      i1: { id: "i1", entrepriseId: "e1", statut: "propose", agentId: "a1", apprenantId: null },
      i2: { id: "i2", entrepriseId: "e1", statut: "nouveau", agentId: null, apprenantId: "ap2" },
    });
    const r = await service.affecterLot({ ...DTO, interetIds: ["i1", "i2"] });
    expect(r).toMatchObject({ affectes: 2, echecs: 0 });
    expect(createMission).toHaveBeenCalledTimes(2);
    expect(createMission).toHaveBeenCalledWith(expect.objectContaining({ agentId: "a1", contratId: "c1", superviseurId: "s1", role: "Closer" }));
    expect(createMission).toHaveBeenCalledWith(expect.objectContaining({ apprenantId: "ap2" }));
    expect(update).toHaveBeenCalledTimes(2);
  });

  it("isole les échecs : un profil en erreur n'empêche pas les autres", async () => {
    const { service, createMission } = build({
      i1: { id: "i1", entrepriseId: "e1", statut: "propose", agentId: "a1", apprenantId: null },
      i2: { id: "i2", entrepriseId: "e1", statut: "propose", agentId: "a2", apprenantId: null },
    });
    createMission.mockRejectedValueOnce(new Error("Ce titulaire a déjà une mission active."));
    const r = await service.affecterLot({ ...DTO, interetIds: ["i1", "i2"] });
    expect(r.affectes).toBe(1);
    expect(r.echecs).toBe(1);
    expect(r.resultats[0]).toMatchObject({ interetId: "i1", ok: false, erreur: "Ce titulaire a déjà une mission active." });
  });

  it("ignore un intérêt déjà affecté, un id inconnu et les doublons", async () => {
    const { service, createMission } = build({
      i1: { id: "i1", entrepriseId: "e1", statut: "affecte", agentId: "a1", apprenantId: null },
    });
    const r = await service.affecterLot({ ...DTO, interetIds: ["i1", "i1", "inconnu"] });
    expect(r.resultats).toHaveLength(2);
    expect(r.resultats.map((x) => x.erreur)).toEqual(["Déjà affecté.", "Intérêt introuvable."]);
    expect(createMission).not.toHaveBeenCalled();
  });

  it("refuse un contrat rattaché à une autre entreprise que celle de la demande", async () => {
    const { service, createMission } = build(
      { i1: { id: "i1", entrepriseId: "e-autre", statut: "propose", agentId: "a1", apprenantId: null } },
      { id: "c1", entrepriseId: "e1" }
    );
    const r = await service.affecterLot({ ...DTO, interetIds: ["i1"] });
    expect(r.echecs).toBe(1);
    expect(r.resultats[0].erreur).toMatch(/autre entreprise/);
    expect(createMission).not.toHaveBeenCalled();
  });

  it("échoue d'emblée si le contrat n'existe pas", async () => {
    const { service } = build({}, null);
    await expect(service.affecterLot({ ...DTO, interetIds: ["i1"] })).rejects.toBeInstanceOf(NotFoundException);
  });
});
