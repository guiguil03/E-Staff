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

  it("laisse passer quand la session correspond exactement au matricule de l'URL", () => {
    const guard = new ApprenantGuard();
    const context = makeContext(
      { estaf_session: signSession({ matricule: "ETF-2026-0001", role: "apprenant" }) },
      { matricule: "ETF-2026-0001" },
      freshIp()
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejette quand la session est celle d'un AUTRE apprenant (IDOR)", () => {
    const guard = new ApprenantGuard();
    const context = makeContext(
      { estaf_session: signSession({ matricule: "ETF-2026-0001", role: "apprenant" }) },
      { matricule: "ETF-2026-0002" },
      freshIp()
    );
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it("rejette une session d'un autre rôle", () => {
    const guard = new ApprenantGuard();
    const context = makeContext(
      { estaf_session: signSession({ matricule: "ETF-2026-0001", role: "formateur" }) },
      { matricule: "ETF-2026-0001" },
      freshIp()
    );
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it("rejette quand aucun cookie de session n'est présent", () => {
    const guard = new ApprenantGuard();
    const context = makeContext({}, { matricule: "ETF-2026-0001" }, freshIp());
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
