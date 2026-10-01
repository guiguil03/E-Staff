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
  it("laisse passer une session formateur", async () => {
    const guard = new FormateurOuRhGuard();
    const context = makeContext({
      estaf_session: signSession({ matricule: "ETF-FORM-2026-0001", role: "formateur" }),
    });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("laisse passer une session rh", async () => {
    const guard = new FormateurOuRhGuard();
    const context = makeContext({ estaf_session: signSession({ matricule: "RH-1", role: "rh" }) });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("rejette une session admin ou apprenant", async () => {
    const guard = new FormateurOuRhGuard();
    await expect(
      guard.canActivate(makeContext({ estaf_session: signSession({ matricule: "ADMIN-1", role: "admin" }) }))
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      guard.canActivate(
        makeContext({ estaf_session: signSession({ matricule: "ETF-2026-0001", role: "apprenant" }) })
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it("rejette quand aucune session n'est présente", async () => {
    const guard = new FormateurOuRhGuard();
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(UnauthorizedException);
  });
});
