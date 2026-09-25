import { describe, expect, it } from "vitest";
import { prochainDepotAttendu, type SeanceNotations } from "./MesNotationsTable";

const MAINTENANT = new Date("2026-09-25T12:00:00Z");

function seance(numero: number, startAt: string | null, notations: SeanceNotations["notations"] = []): SeanceNotations {
  return { numero, startAt, notations };
}

function notation(competence: string, extra: Partial<SeanceNotations["notations"][number]> = {}) {
  return {
    competence,
    fileName: null,
    soumisAt: null,
    gridData: null,
    note: null,
    commentaires: null,
    scoreOn20: null,
    gradedAt: null,
    ...extra,
  };
}

describe("prochainDepotAttendu (raccourci « Rendre un exercice »)", () => {
  it("vise la séance commencée la plus récente qui attend encore un devoir", () => {
    const cible = prochainDepotAttendu(
      [
        seance(1, "2026-09-10T08:00:00Z"),
        seance(2, "2026-09-20T08:00:00Z"),
        seance(3, "2026-10-01T08:00:00Z"),
      ],
      MAINTENANT
    );
    expect(cible?.numero).toBe(2);
  });

  it("ignore les compétences déjà déposées ou notées et les séances non planifiées", () => {
    const toutRendu = ["expression_orale", "expression_ecrite", "posture_eloquence"].map((c, i) =>
      notation(c, i === 0 ? { scoreOn20: 14 } : { fileName: "devoir.pdf" })
    );
    const cible = prochainDepotAttendu(
      [seance(1, "2026-09-10T08:00:00Z", toutRendu), seance(2, null), seance(3, "2026-10-01T08:00:00Z")],
      MAINTENANT
    );
    expect(cible?.numero).toBe(3);
  });

  it("renvoie null quand il n'y a rien à rendre", () => {
    expect(prochainDepotAttendu([seance(1, null)], MAINTENANT)).toBeNull();
  });
});
