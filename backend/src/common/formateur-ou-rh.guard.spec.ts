import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { FormateurOuRhGuard } from "./formateur-ou-rh.guard";
import { signSession } from "./session";

process.env.JWT_SECRET = "test-secret";

function makeContext(cookies: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ cookies }) }),
  } as unknown as ExecutionContext;
}

describe("FormateurOuRhGuard", () => {
  it("laisse passer une session formateur", () => {
    const guard = new FormateurOuRhGuard();
    const context = makeContext({
      estaf_session: signSession({ matricule: "ETF-FORM-2026-0001", role: "formateur" }),
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("laisse passer une session rh", () => {
    const guard = new FormateurOuRhGuard();
    const context = makeContext({ estaf_session: signSession({ matricule: "RH-1", role: "rh" }) });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejette une session admin ou apprenant", () => {
    const guard = new FormateurOuRhGuard();
    expect(() =>
      guard.canActivate(makeContext({ estaf_session: signSession({ matricule: "ADMIN-1", role: "admin" }) }))
    ).toThrow(UnauthorizedException);
    expect(() =>
      guard.canActivate(
        makeContext({ estaf_session: signSession({ matricule: "ETF-2026-0001", role: "apprenant" }) })
      )
    ).toThrow(UnauthorizedException);
  });

  it("rejette quand aucune session n'est présente", () => {
    const guard = new FormateurOuRhGuard();
    expect(() => guard.canActivate(makeContext({}))).toThrow(UnauthorizedException);
  });
});
