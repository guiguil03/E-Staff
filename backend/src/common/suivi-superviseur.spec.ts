import { cartesSuperviseur, primesSuperviseur, type EquipeAgentJours } from "./suivi-superviseur";
import type { JourSuivi } from "./suivi-agent";

const now = new Date("2026-10-27T10:00:00Z");

const jour = (iso: string, over: Partial<JourSuivi> = {}): JourSuivi => ({
  jour: new Date(`${iso}T00:00:00Z`),
  tauxAtteint: 5,
  heuresTravaillees: 8,
  heuresPanne: 0,
  statutValidation: "valide",
  ...over,
});

// Semaine ISO 2026-W41 : 05/10 -> 11/10 (terminée au 27/10).
const vert = (id: string): EquipeAgentJours => ({ agentId: id, jours: [jour("2026-10-05"), jour("2026-10-06")] });
const orange = (id: string): EquipeAgentJours => ({
  agentId: id,
  jours: [jour("2026-10-05", { tauxAtteint: 4 })],
});

describe("primesSuperviseur", () => {
  it("accorde 20 € quand 7 agents sur 10 sont au vert toute la semaine", () => {
    const equipe = [
      ...Array.from({ length: 7 }, (_, i) => vert(`v${i}`)),
      ...Array.from({ length: 3 }, (_, i) => orange(`o${i}`)),
    ];

    const r = primesSuperviseur(equipe, "2026-10", now);

    expect(r[0]).toMatchObject({ semaine: "2026-W41", agentsVerts: 7, agentsTotal: 10, etat: "acquise", montant: 20 });
  });

  it("refuse la prime à 6 agents sur 10", () => {
    const equipe = [
      ...Array.from({ length: 6 }, (_, i) => vert(`v${i}`)),
      ...Array.from({ length: 4 }, (_, i) => orange(`o${i}`)),
    ];

    const r = primesSuperviseur(equipe, "2026-10", now);

    expect(r[0]).toMatchObject({ agentsVerts: 6, etat: "perdue", montant: 0 });
  });

  it("compte un agent sans saisie comme non vert (dénominateur = effectif)", () => {
    const equipe = [vert("a"), vert("b"), { agentId: "c", jours: [] }];

    const r = primesSuperviseur(equipe, "2026-10", now);

    // 2/3 = 66,7 % < 70 %
    expect(r[0]).toMatchObject({ agentsVerts: 2, agentsTotal: 3, etat: "perdue" });
  });

  it("laisse la semaine en cours sans prime", () => {
    const equipe = [{ agentId: "a", jours: [jour("2026-10-26")] }];

    expect(primesSuperviseur(equipe, "2026-10", now)[0]).toMatchObject({ etat: "en_cours", montant: 0 });
  });
});

describe("cartesSuperviseur", () => {
  it("calcule base 400 €, retenue d'absence non justifiée et prime", () => {
    const equipe = Array.from({ length: 10 }, (_, i) => vert(`v${i}`));

    const c = cartesSuperviseur({
      equipe,
      absences: [
        { jour: new Date("2026-10-07T00:00:00Z"), heures: 4, justifiee: false },
        { jour: new Date("2026-10-08T00:00:00Z"), heures: 8, justifiee: true },
        { jour: new Date("2026-09-30T00:00:00Z"), heures: 8, justifiee: false },
      ],
      periode: "2026-10",
      now,
    });

    expect(c.salaire.tauxHoraire).toBe(2.5);
    expect(c.absences).toEqual({ heures: 4, retenues: 10 });
    expect(c.primes.total).toBe(20);
    expect(c.net).toBe(410);
  });

  it("sans équipe : base seule, aucune prime", () => {
    const c = cartesSuperviseur({ equipe: [], absences: [], periode: "2026-10", now });

    expect(c.net).toBe(400);
    expect(c.primes.semaines).toEqual([]);
  });
});
