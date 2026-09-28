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

  it("laisse passer tant que la limite n'est pas atteinte", async () => {
    const Guard = RateLimitGuard("test-a", 3);
    const guard = new Guard();
    const ip = freshIp();
    await expect(guard.canActivate(makeContext(ip))).resolves.toBe(true);
    await expect(guard.canActivate(makeContext(ip))).resolves.toBe(true);
    await expect(guard.canActivate(makeContext(ip))).resolves.toBe(true);
  });

  it("rejette au-delà de la limite pour la même IP", async () => {
    const Guard = RateLimitGuard("test-b", 2);
    const guard = new Guard();
    const ip = freshIp();
    await expect(guard.canActivate(makeContext(ip))).resolves.toBe(true);
    await expect(guard.canActivate(makeContext(ip))).resolves.toBe(true);
    await expect(guard.canActivate(makeContext(ip))).rejects.toThrow(HttpException);
    await expect(guard.canActivate(makeContext(ip))).rejects.toThrow(/Trop de requêtes/);
  });

  it("compte séparément deux IP différentes", async () => {
    const Guard = RateLimitGuard("test-c", 1);
    const guard = new Guard();
    await expect(guard.canActivate(makeContext(freshIp()))).resolves.toBe(true);
    await expect(guard.canActivate(makeContext(freshIp()))).resolves.toBe(true);
  });

  it("compte séparément deux préfixes différents pour la même IP", async () => {
    const ip = freshIp();
    const GuardA = RateLimitGuard("test-d-a", 1);
    const GuardB = RateLimitGuard("test-d-b", 1);
    await expect(new GuardA().canActivate(makeContext(ip))).resolves.toBe(true);
    await expect(new GuardB().canActivate(makeContext(ip))).resolves.toBe(true);
  });

  it("réautorise après expiration de la fenêtre", async () => {
    const Guard = RateLimitGuard("test-e", 1, 50);
    const guard = new Guard();
    const ip = freshIp();
    await expect(guard.canActivate(makeContext(ip))).resolves.toBe(true);
    await expect(guard.canActivate(makeContext(ip))).rejects.toThrow(HttpException);
    await new Promise((r) => setTimeout(r, 60));
    await expect(guard.canActivate(makeContext(ip))).resolves.toBe(true);
  });
});
