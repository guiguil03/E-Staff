import { nouveauLienToken, whereLien } from "./lien-token";

describe("jetons des liens publics (contrat, paiement)", () => {
  it("génère des jetons longs, aléatoires et utilisables dans une URL", () => {
    const a = nouveauLienToken();
    const b = nouveauLienToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("n'accepte l'identifiant brut que pour les lignes antérieures aux jetons", () => {
    expect(whereLien("abc")).toEqual({
      OR: [{ lienToken: "abc" }, { id: "abc", accesParIdAutorise: true }],
    });
  });
});
