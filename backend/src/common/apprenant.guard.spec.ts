import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ApprenantGuard } from "./apprenant.guard";
import { signSession } from "./session";

process.env.JWT_SECRET = "test-secret";

function makeContext(
  cookies: Record<string, string | undefined>,
  params: Record<string, string>,
  ip: string
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ cookies, params, ip }),
    }),
  } as unknown as ExecutionContext;
}

describe("ApprenantGuard", () => {
  let ipCounter = 0;

  function freshIp(): string {
    ipCounter += 1;
    return `10.99.2.${ipCounter}`;
  }

  it("laisse passer quand la session correspond exactement au matricule de l'URL", async () => {
    const guard = new ApprenantGuard();
    const context = makeContext(
      { estaf_session: signSession({ matricule: "ETF-2026-0001", role: "apprenant" }) },
      { matricule: "ETF-2026-0001" },
      freshIp()
    );
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("rejette quand la session est celle d'un AUTRE apprenant (IDOR)", async () => {
    const guard = new ApprenantGuard();
    const context = makeContext(
      { estaf_session: signSession({ matricule: "ETF-2026-0001", role: "apprenant" }) },
      { matricule: "ETF-2026-0002" },
      freshIp()
    );
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejette une session d'un autre rôle", async () => {
    const guard = new ApprenantGuard();
    const context = makeContext(
      { estaf_session: signSession({ matricule: "ETF-2026-0001", role: "formateur" }) },
      { matricule: "ETF-2026-0001" },
      freshIp()
    );
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejette quand aucun cookie de session n'est présent", async () => {
    const guard = new ApprenantGuard();
    const context = makeContext({}, { matricule: "ETF-2026-0001" }, freshIp());
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("laisse passer une session valide même quand l'IP est verrouillée par d'autres échecs", async () => {
    const guard = new ApprenantGuard();
    const ip = freshIp();
    for (let i = 0; i < 5; i++) {
      await expect(guard.canActivate(makeContext({}, { matricule: "ETF-2026-0001" }, ip))).rejects.toThrow(
        UnauthorizedException
      );
    }
    await expect(guard.canActivate(makeContext({}, { matricule: "ETF-2026-0001" }, ip))).rejects.toThrow(
      /Trop de tentatives/
    );

    const valide = makeContext(
      { estaf_session: signSession({ matricule: "ETF-2026-0002", role: "apprenant" }) },
      { matricule: "ETF-2026-0002" },
      ip
    );
    await expect(guard.canActivate(valide)).resolves.toBe(true);
  });
});
