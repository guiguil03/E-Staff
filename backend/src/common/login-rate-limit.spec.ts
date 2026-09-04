import { recordFailure, recordSuccess, remainingLockoutSeconds } from "./login-rate-limit";

// Le store est un Map module-level (process unique, voir login-rate-limit.ts)
// donc chaque test utilise sa propre clé pour ne pas interférer avec les
// autres tests de ce fichier.
let keyCounter = 0;
function freshKey(): string {
  keyCounter += 1;
  return `test-key-${keyCounter}`;
}

describe("login-rate-limit", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("ne verrouille pas une clé jamais vue", () => {
    expect(remainingLockoutSeconds(freshKey())).toBe(0);
  });

  it("ne verrouille pas en dessous de MAX_ATTEMPTS (5) échecs", () => {
    const key = freshKey();
    recordFailure(key);
    recordFailure(key);
    recordFailure(key);
    recordFailure(key);
    expect(remainingLockoutSeconds(key)).toBe(0);
  });

  it("verrouille pour ~15 minutes au 5e échec consécutif", () => {
    const key = freshKey();
    for (let i = 0; i < 5; i++) recordFailure(key);

    const remaining = remainingLockoutSeconds(key);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(15 * 60);
  });

  it("le verrou expire après 15 minutes puis autorise de nouveau des tentatives", () => {
    jest.useFakeTimers();
    const key = freshKey();
    for (let i = 0; i < 5; i++) recordFailure(key);
    expect(remainingLockoutSeconds(key)).toBeGreaterThan(0);

    jest.advanceTimersByTime(15 * 60 * 1000 + 1000);
    expect(remainingLockoutSeconds(key)).toBe(0);
  });

  it("recordSuccess efface le compteur d'échecs (repart de zéro)", () => {
    const key = freshKey();
    recordFailure(key);
    recordFailure(key);
    recordFailure(key);
    recordSuccess(key);

    // Si le compteur n'avait pas été effacé, ces 2 échecs suffiraient à
    // atteindre 5 et donc à verrouiller — on vérifie que ce n'est pas le cas.
    recordFailure(key);
    recordFailure(key);
    expect(remainingLockoutSeconds(key)).toBe(0);
  });

  it("recordSuccess sur une clé déjà verrouillée lève le verrou", () => {
    const key = freshKey();
    for (let i = 0; i < 5; i++) recordFailure(key);
    expect(remainingLockoutSeconds(key)).toBeGreaterThan(0);

    recordSuccess(key);
    expect(remainingLockoutSeconds(key)).toBe(0);
  });
});
