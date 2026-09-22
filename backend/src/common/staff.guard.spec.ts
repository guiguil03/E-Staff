import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { StaffGuard } from "./staff.guard";
import { signSession } from "./session";

process.env.JWT_SECRET = "test-secret";

function makeContext(cookies: Record<string, string | undefined>, ip: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ cookies, ip }),
    }),
  } as unknown as ExecutionContext;
}

describe("StaffGuard", () => {
  let ipCounter = 0;

  function freshIp(): string {
    ipCounter += 1;
    return `10.99.1.${ipCounter}`;
  }

  it("laisse passer avec une session admin", () => {
    const guard = new StaffGuard();
    const context = makeContext(
      { estaf_session: signSession({ matricule: "ADMIN-1", role: "admin" }) },
      freshIp()
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it("laisse passer avec une session RH", () => {
    const guard = new StaffGuard();
    const context = makeContext(
      { estaf_session: signSession({ matricule: "RH-1", role: "rh" }) },
      freshIp()
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejette une session d'un autre rôle", () => {
    const guard = new StaffGuard();
    const context = makeContext(
      { estaf_session: signSession({ matricule: "ETF-FORM-2026-0001", role: "formateur" }) },
      freshIp()
    );
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it("rejette quand aucun cookie de session n'est présent", () => {
    const guard = new StaffGuard();
    expect(() => guard.canActivate(makeContext({}, freshIp()))).toThrow(UnauthorizedException);
  });
});
