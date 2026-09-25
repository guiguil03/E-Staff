import { calculerStatut, seuilDernieresPlaces } from "./statut";

const NOW = new Date("2026-09-25T10:00:00.000Z");

function offre(overrides: Partial<Parameters<typeof calculerStatut>[0]> = {}) {
  return { placesTotal: 10, placesPourvues: 0, dateLimite: null, cloturee: false, ...overrides };
}

describe("calculerStatut", () => {
  it("ouvert avec des places restantes (exemple cliente : 7/10 → 3 restantes, 70 %)", () => {
    expect(calculerStatut(offre({ placesPourvues: 7 }), NOW)).toEqual({
      statut: "ouvert",
      motifCloture: null,
      placesRestantes: 3,
      tauxRemplissage: 70,
    });
  });

  it("dernières places quand il reste peu de places", () => {
    expect(calculerStatut(offre({ placesPourvues: 9 }), NOW).statut).toBe("presque_complet");
    expect(calculerStatut(offre({ placesPourvues: 8 }), NOW).statut).toBe("presque_complet");
    expect(calculerStatut(offre({ placesTotal: 3, placesPourvues: 2 }), NOW).statut).toBe("presque_complet");
  });

  it("se clôture automatiquement quand toutes les places sont pourvues", () => {
    expect(calculerStatut(offre({ placesPourvues: 10 }), NOW)).toEqual({
      statut: "cloture",
      motifCloture: "complet",
      placesRestantes: 0,
      tauxRemplissage: 100,
    });
  });

  it("se clôture automatiquement une fois la date limite passée", () => {
    const r = calculerStatut(offre({ dateLimite: new Date("2026-09-24T23:59:00.000Z") }), NOW);
    expect(r.statut).toBe("cloture");
    expect(r.motifCloture).toBe("date_limite");
    expect(calculerStatut(offre({ dateLimite: new Date("2026-09-30T00:00:00.000Z") }), NOW).statut).toBe(
      "ouvert"
    );
  });

  it("respecte une fermeture manuelle même avec des places restantes", () => {
    const r = calculerStatut(offre({ cloturee: true }), NOW);
    expect(r.statut).toBe("cloture");
    expect(r.motifCloture).toBe("manuel");
  });

  it("ne dépasse jamais 100 % ni des places négatives", () => {
    const r = calculerStatut(offre({ placesPourvues: 12 }), NOW);
    expect(r.placesRestantes).toBe(0);
    expect(r.tauxRemplissage).toBe(100);
  });

  it("seuil des dernières places : 20 % arrondi, au moins 1", () => {
    expect(seuilDernieresPlaces(10)).toBe(2);
    expect(seuilDernieresPlaces(3)).toBe(1);
    expect(seuilDernieresPlaces(1)).toBe(1);
  });
});
