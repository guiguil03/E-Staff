import { computeTier, computeTotalScore } from "./scoring";

describe("computeTier", () => {
  it("refuse les scores les plus bas (<=30)", () => {
    expect(computeTier(0)).toBe("refuse");
    expect(computeTier(30)).toBe("refuse");
  });

  it("formation_b1 juste au-dessus de 30, jusqu'à 45", () => {
    expect(computeTier(30.01)).toBe("formation_b1");
    expect(computeTier(45)).toBe("formation_b1");
  });

  it("niveau_b2 juste au-dessus de 45, jusqu'à 60", () => {
    expect(computeTier(45.01)).toBe("niveau_b2");
    expect(computeTier(60)).toBe("niveau_b2");
  });

  it("niveau_c1 juste au-dessus de 60, jusqu'à 75", () => {
    expect(computeTier(60.01)).toBe("niveau_c1");
    expect(computeTier(75)).toBe("niveau_c1");
  });

  it("placement_direct au-dessus de 75", () => {
    expect(computeTier(75.01)).toBe("placement_direct");
    expect(computeTier(100)).toBe("placement_direct");
  });
});

describe("computeTotalScore", () => {
  it("retourne null quand aucun score n'est défini", () => {
    expect(computeTotalScore([])).toBeNull();
    expect(computeTotalScore([null, undefined, null])).toBeNull();
  });

  it("ramène un score /20 unique sur 100", () => {
    expect(computeTotalScore([20])).toBe(100);
    expect(computeTotalScore([10])).toBe(50);
    expect(computeTotalScore([0])).toBe(0);
  });

  it("fait la moyenne des scores définis, en ignorant null/undefined (prorata)", () => {
    // Seuls 2 blocs notés sur 5 (les 3 autres pas encore corrigés) — le
    // score total doit se calculer uniquement sur les 2 définis, pas
    // pénaliser le candidat pour des blocs pas encore corrigés.
    expect(computeTotalScore([20, 10, null, undefined, null])).toBe(75);
  });

  it("prend en compte tous les scores une fois le test entièrement corrigé (5 blocs /100)", () => {
    expect(computeTotalScore([20, 20, 20, 20, 20])).toBe(100);
    expect(computeTotalScore([10, 10, 10, 10, 10])).toBe(50);
    expect(computeTotalScore([20, 15, 10, 5, 0])).toBe(50);
  });

  it("arrondit à 2 décimales", () => {
    // (17 + 13 + 15) / 3 = 15, /20*100 = 75 pile — cas volontairement
    // choisi pour vérifier un arrondi non trivial ci-dessous aussi.
    expect(computeTotalScore([17, 13, 15])).toBe(75);
    // 1/3 des scores à 20, 2/3 à 0 -> moyenne 6.666... -> /20*100 = 33.33...
    expect(computeTotalScore([20, 0, 0])).toBe(33.33);
  });
});
