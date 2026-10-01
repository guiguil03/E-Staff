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

  it("ne verrouille pas une clé jamais vue", async () => {
    expect(await remainingLockoutSeconds(freshKey())).toBe(0);
  });

  it("ne verrouille pas en dessous de MAX_ATTEMPTS (5) échecs", async () => {
    const key = freshKey();
    await recordFailure(key);
    await recordFailure(key);
    await recordFailure(key);
    await recordFailure(key);
    expect(await remainingLockoutSeconds(key)).toBe(0);
  });

  it("verrouille pour ~15 minutes au 5e échec consécutif", async () => {
    const key = freshKey();
    for (let i = 0; i < 5; i++) await recordFailure(key);

    const remaining = await remainingLockoutSeconds(key);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(15 * 60);
  });

  it("le verrou expire après 15 minutes puis autorise de nouveau des tentatives", async () => {
    jest.useFakeTimers();
    const key = freshKey();
    for (let i = 0; i < 5; i++) await recordFailure(key);
    expect(await remainingLockoutSeconds(key)).toBeGreaterThan(0);

    jest.advanceTimersByTime(15 * 60 * 1000 + 1000);
    expect(await remainingLockoutSeconds(key)).toBe(0);
  });

  it("recordSuccess efface le compteur d'échecs (repart de zéro)", async () => {
    const key = freshKey();
    await recordFailure(key);
    await recordFailure(key);
    await recordFailure(key);
    await recordSuccess(key);

    // Si le compteur n'avait pas été effacé, ces 2 échecs suffiraient à
    // atteindre 5 et donc à verrouiller — on vérifie que ce n'est pas le cas.
    await recordFailure(key);
    await recordFailure(key);
    expect(await remainingLockoutSeconds(key)).toBe(0);
  });

  it("recordSuccess sur une clé déjà verrouillée lève le verrou", async () => {
    const key = freshKey();
    for (let i = 0; i < 5; i++) await recordFailure(key);
    expect(await remainingLockoutSeconds(key)).toBeGreaterThan(0);

    await recordSuccess(key);
    expect(await remainingLockoutSeconds(key)).toBe(0);
  });
});
