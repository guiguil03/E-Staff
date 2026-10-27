import { cartesRemuneration, niveauAlerte, primesHebdo, type JourSuivi } from "./suivi-agent";

const jour = (iso: string, over: Partial<JourSuivi> = {}): JourSuivi => ({
  jour: new Date(`${iso}T00:00:00Z`),
  tauxAtteint: 5,
  heuresTravaillees: 8,
  heuresPanne: 0,
  statutValidation: "valide",
  ...over,
});

describe("niveauAlerte", () => {
  it.each([
    [0, "rouge"],
    [2.99, "rouge"],
    [3, "orange"],
    [4, "orange"],
    [4.99, "orange"],
    [5, "vert"],
    [12, "vert"],
  ])("%s%% -> %s", (taux, attendu) => {
    expect(niveauAlerte(taux)).toBe(attendu);
  });
});

describe("primesHebdo", () => {
  const now = new Date("2026-10-27T10:00:00Z");

  it("accorde 15 € à une semaine terminée, validée et toute verte", () => {
    // Semaine ISO 2026-W40 : 28/09 -> 04/10.
    const r = primesHebdo([jour("2026-09-28"), jour("2026-09-29")], "2026-09", now);
    expect(r).toEqual([{ semaine: "2026-W40", rang: 1, etat: "acquise", montant: 15 }]);
  });

  it("perd la prime dès une alerte orange ou rouge", () => {
    const r = primesHebdo([jour("2026-10-05"), jour("2026-10-06", { tauxAtteint: 4 })], "2026-10", now);
    expect(r[0]).toMatchObject({ etat: "perdue", montant: 0 });
  });

  it("laisse en cours une semaine terminée mais pas entièrement validée", () => {
    const r = primesHebdo([jour("2026-10-05", { statutValidation: "a_valider" })], "2026-10", now);
    expect(r[0]).toMatchObject({ etat: "en_cours", montant: 0 });
  });

  it("laisse en cours la semaine courante", () => {
    const r = primesHebdo([jour("2026-10-26")], "2026-10", now);
    expect(r[0]).toMatchObject({ etat: "en_cours", montant: 0 });
  });
});

describe("cartesRemuneration", () => {
  const now = new Date("2026-10-27T10:00:00Z");

  it("calcule taux horaire, retenues et net du mois sur les journées validées", () => {
    const c = cartesRemuneration({
      jours: [
        jour("2026-10-05", { heuresTravaillees: 8, heuresPanne: 2 }),
        jour("2026-10-06", { heuresTravaillees: 8 }),
        jour("2026-10-07", { heuresTravaillees: 4, statutValidation: "a_valider" }),
      ],
      periode: "2026-10",
      salaireBase: null,
      now,
    });
    expect(c.salaire.tauxHoraire).toBe(1.88); // 300 / 160 = 1,875 arrondi
    expect(c.salaire.heuresValidees).toBe(16);
    expect(c.salaire.heuresEnAttente).toBe(4);
    expect(c.pannes).toEqual({ heures: 2, retenues: 3.76 });
    // Semaine 41 contient une journée à valider : pas de prime.
    expect(c.primes.total).toBe(0);
    expect(c.net).toBe(296.24);
  });

  it("utilise Agent.salaireBase quand il est renseigné", () => {
    const c = cartesRemuneration({ jours: [], periode: "2026-10", salaireBase: 480, now });
    expect(c.salaire.base).toBe(480);
    expect(c.salaire.tauxHoraire).toBe(3);
    expect(c.net).toBe(480);
  });
});
