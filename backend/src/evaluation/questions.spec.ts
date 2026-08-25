import { scoreQcm, LEXIQUE_QUESTIONS, ORAL_QUESTIONS, QcmQuestion } from "./questions";

const BANK: QcmQuestion[] = [
  { id: "q1", prompt: "Q1", choices: ["a", "b"], correctChoice: "a" },
  { id: "q2", prompt: "Q2", choices: ["a", "b"], correctChoice: "b" },
  { id: "q3", prompt: "Q3", choices: ["a", "b"], correctChoice: "a" },
  { id: "q4", prompt: "Q4", choices: ["a", "b"], correctChoice: "b" },
];

describe("scoreQcm", () => {
  it("retourne 0 sur une banque vide", () => {
    expect(scoreQcm([], { q1: "a" })).toBe(0);
  });

  it("retourne 0 si aucune réponse n'est correcte", () => {
    expect(scoreQcm(BANK, { q1: "b", q2: "a", q3: "b", q4: "a" })).toBe(0);
  });

  it("retourne le maxScore complet si tout est correct", () => {
    expect(scoreQcm(BANK, { q1: "a", q2: "b", q3: "a", q4: "b" })).toBe(20);
    expect(scoreQcm(BANK, { q1: "a", q2: "b", q3: "a", q4: "b" }, 10)).toBe(10);
  });

  it("calcule au prorata pour un score partiel", () => {
    // 2 bonnes réponses sur 4 -> moitié du barème.
    expect(scoreQcm(BANK, { q1: "a", q2: "b", q3: "b", q4: "a" })).toBe(10);
    expect(scoreQcm(BANK, { q1: "a", q2: "b", q3: "b", q4: "a" }, 10)).toBe(5);
  });

  it("ne compte pas les questions sans réponse comme correctes", () => {
    expect(scoreQcm(BANK, { q1: "a" })).toBe(5); // 1/4 * 20
    expect(scoreQcm(BANK, {})).toBe(0);
  });

  it("ignore une réponse pour un id de question qui n'existe pas dans la banque", () => {
    expect(scoreQcm(BANK, { q1: "a", "id-inconnu": "a" })).toBe(5);
  });

  it("respecte le maxScore custom (Bloc 1 Partie 1 = /10, Bloc 4 = /20 par défaut)", () => {
    expect(scoreQcm(LEXIQUE_QUESTIONS, {}, 10)).toBe(0);
    const allCorrectLexique = Object.fromEntries(
      LEXIQUE_QUESTIONS.map((q) => [q.id, q.correctChoice])
    );
    expect(scoreQcm(LEXIQUE_QUESTIONS, allCorrectLexique, 10)).toBe(10);

    const allCorrectOral = Object.fromEntries(ORAL_QUESTIONS.map((q) => [q.id, q.correctChoice]));
    expect(scoreQcm(ORAL_QUESTIONS, allCorrectOral)).toBe(20);
  });
});

describe("banques de questions — intégrité des données", () => {
  it("LEXIQUE_QUESTIONS a bien 10 questions, chacune avec un id unique et 4 choix", () => {
    expect(LEXIQUE_QUESTIONS).toHaveLength(10);
    const ids = LEXIQUE_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of LEXIQUE_QUESTIONS) {
      expect(q.choices).toHaveLength(4);
      expect(q.choices).toContain(q.correctChoice);
    }
  });

  it("ORAL_QUESTIONS a des ids uniques et correctChoice fait partie des choix proposés", () => {
    const ids = ORAL_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of ORAL_QUESTIONS) {
      expect(q.choices).toContain(q.correctChoice);
    }
  });
});
