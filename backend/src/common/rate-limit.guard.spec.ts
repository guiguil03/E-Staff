import { ExecutionContext, HttpException } from "@nestjs/common";
import { RateLimitGuard } from "./rate-limit.guard";

function makeContext(ip: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ ip }),
    }),
  } as unknown as ExecutionContext;
}

describe("RateLimitGuard", () => {
  let ipCounter = 0;
  function freshIp(): string {
    ipCounter += 1;
    return `10.50.0.${ipCounter}`;
  }

  it("laisse passer tant que la limite n'est pas atteinte", () => {
    const Guard = RateLimitGuard("test-a", 3);
    const guard = new Guard();
    const ip = freshIp();
    expect(guard.canActivate(makeContext(ip))).toBe(true);
    expect(guard.canActivate(makeContext(ip))).toBe(true);
    expect(guard.canActivate(makeContext(ip))).toBe(true);
  });

  it("rejette au-delà de la limite pour la même IP", () => {
    const Guard = RateLimitGuard("test-b", 2);
    const guard = new Guard();
    const ip = freshIp();
    expect(guard.canActivate(makeContext(ip))).toBe(true);
    expect(guard.canActivate(makeContext(ip))).toBe(true);
    expect(() => guard.canActivate(makeContext(ip))).toThrow(HttpException);
    expect(() => guard.canActivate(makeContext(ip))).toThrow(/Trop de requêtes/);
  });

  it("compte séparément deux IP différentes", () => {
    const Guard = RateLimitGuard("test-c", 1);
    const guard = new Guard();
    expect(guard.canActivate(makeContext(freshIp()))).toBe(true);
    expect(guard.canActivate(makeContext(freshIp()))).toBe(true);
  });

  it("compte séparément deux préfixes différents pour la même IP", () => {
    const ip = freshIp();
    const GuardA = RateLimitGuard("test-d-a", 1);
    const GuardB = RateLimitGuard("test-d-b", 1);
    expect(new GuardA().canActivate(makeContext(ip))).toBe(true);
    expect(new GuardB().canActivate(makeContext(ip))).toBe(true);
  });

  it("réautorise après expiration de la fenêtre", async () => {
    const Guard = RateLimitGuard("test-e", 1, 50);
    const guard = new Guard();
    const ip = freshIp();
    expect(guard.canActivate(makeContext(ip))).toBe(true);
    expect(() => guard.canActivate(makeContext(ip))).toThrow(HttpException);
    await new Promise((r) => setTimeout(r, 60));
    expect(guard.canActivate(makeContext(ip))).toBe(true);
  });
});
