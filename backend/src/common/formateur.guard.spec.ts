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

  it("laisse passer avec une session formateur valide et réinjecte le matricule dans le header", () => {
    const guard = new FormateurGuard();
    const context = makeContext(formateurCookie("ETF-FORM-2026-0001"), freshIp());
    expect(guard.canActivate(context)).toBe(true);
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    expect(request.headers["x-formateur-matricule"]).toBe("ETF-FORM-2026-0001");
  });

  it("rejette une session d'un autre rôle", () => {
    const guard = new FormateurGuard();
    const context = makeContext({ estaf_session: signSession({ matricule: "ETF-2026-0001", role: "apprenant" }) }, freshIp());
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow("Session formateur invalide ou expirée.");
  });

  it("rejette quand aucun cookie de session n'est présent", () => {
    const guard = new FormateurGuard();
    const context = makeContext({}, freshIp());
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it("verrouille l'IP après 5 échecs consécutifs, même avec une session valide ensuite", () => {
    const guard = new FormateurGuard();
    const ip = freshIp();

    for (let i = 0; i < 5; i++) {
      expect(() => guard.canActivate(makeContext({}, ip))).toThrow(UnauthorizedException);
    }

    expect(() => guard.canActivate(makeContext(formateurCookie(), ip))).toThrow(/Trop de tentatives/);
  });

  it("une réussite remet le compteur d'échecs à zéro pour cette IP", () => {
    const guard = new FormateurGuard();
    const ip = freshIp();

    expect(() => guard.canActivate(makeContext({}, ip))).toThrow();
    expect(() => guard.canActivate(makeContext({}, ip))).toThrow();
    expect(guard.canActivate(makeContext(formateurCookie(), ip))).toBe(true);

    for (let i = 0; i < 4; i++) {
      expect(() => guard.canActivate(makeContext({}, ip))).toThrow(
        "Session formateur invalide ou expirée."
      );
    }
  });
});
