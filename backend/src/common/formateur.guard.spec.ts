import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { FormateurGuard } from "./formateur.guard";
import { signSession } from "./session";

process.env.JWT_SECRET = "test-secret";

function makeContext(cookies: Record<string, string | undefined>, ip: string): ExecutionContext {
  const request: { cookies: Record<string, string | undefined>; ip: string; headers: Record<string, string> } = {
    cookies,
    ip,
    headers: {},
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe("FormateurGuard", () => {
  let ipCounter = 0;

  function freshIp(): string {
    ipCounter += 1;
    return `10.99.0.${ipCounter}`;
  }

  function formateurCookie(matricule = "ETF-FORM-2026-0001") {
    return { estaf_session: signSession({ matricule, role: "formateur" }) };
  }

  it("laisse passer avec une session formateur valide et réinjecte le matricule dans le header", async () => {
    const guard = new FormateurGuard();
    const context = makeContext(formateurCookie("ETF-FORM-2026-0001"), freshIp());
    await expect(guard.canActivate(context)).resolves.toBe(true);
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    expect(request.headers["x-formateur-matricule"]).toBe("ETF-FORM-2026-0001");
  });

  it("rejette une session d'un autre rôle", async () => {
    const guard = new FormateurGuard();
    const context = makeContext({ estaf_session: signSession({ matricule: "ETF-2026-0001", role: "apprenant" }) }, freshIp());
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow("Session formateur invalide ou expirée.");
  });

  it("rejette quand aucun cookie de session n'est présent", async () => {
    const guard = new FormateurGuard();
    const context = makeContext({}, freshIp());
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("verrouille l'IP après 5 échecs consécutifs ; une session valide passe toujours", async () => {
    const guard = new FormateurGuard();
    const ip = freshIp();

    for (let i = 0; i < 5; i++) {
      await expect(guard.canActivate(makeContext({}, ip))).rejects.toThrow(UnauthorizedException);
    }

    await expect(guard.canActivate(makeContext({}, ip))).rejects.toThrow(/Trop de tentatives/);
    // Le verrou vise les tentatives invalides (audit du 2026-09-28) : une
    // personne réellement connectée derrière la même IP n'est pas bloquée.
    await expect(guard.canActivate(makeContext(formateurCookie(), ip))).resolves.toBe(true);
  });
});
