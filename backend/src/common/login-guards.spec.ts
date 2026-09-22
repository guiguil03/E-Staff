import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";
import { RhGuard } from "./rh.guard";
import { signSession } from "./session";

// AdminGuard et RhGuard partagent exactement le même squelette (session
// signée par cookie + anti-brute-force via login-rate-limit.ts) — un seul
// fichier paramétré plutôt que 2 fichiers quasi identiques, un cas par
// guard suffit à couvrir la logique propre à chacun (rôle attendu, message
// d'erreur). FormateurGuard a son propre fichier (formateur.guard.spec.ts).
// ApprenantGuard aussi (apprenant.guard.spec.ts) — vérifie en plus que le
// matricule de la session correspond à celui de l'URL. StaffGuard (les deux
// rôles à la fois) a aussi son propre fichier (staff.guard.spec.ts).
process.env.JWT_SECRET = "test-secret";

function makeContext(cookies: Record<string, string | undefined>, ip: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ cookies, ip }),
    }),
  } as unknown as ExecutionContext;
}

const cases = [
  {
    name: "AdminGuard",
    Guard: AdminGuard,
    role: "admin" as const,
    invalidMessage: "Session admin invalide ou expirée.",
    keyPrefix: "admin",
  },
  {
    name: "RhGuard",
    Guard: RhGuard,
    role: "rh" as const,
    invalidMessage: "Session RH invalide ou expirée.",
    keyPrefix: "rh",
  },
];

describe.each(cases)("$name", ({ Guard, role, invalidMessage, keyPrefix }) => {
  let ipCounter = 0;

  function freshIp(): string {
    ipCounter += 1;
    return `10.${keyPrefix.length}.0.${ipCounter}`;
  }

  function validCookie() {
    return { estaf_session: signSession({ matricule: "ETF-2026-0001", role }) };
  }

  function wrongRoleCookie() {
    const otherRole = role === "admin" ? "rh" : "admin";
    return { estaf_session: signSession({ matricule: "ETF-2026-0001", role: otherRole }) };
  }

  it("laisse passer avec une session du bon rôle", () => {
    const guard = new Guard();
    const context = makeContext(validCookie(), freshIp());
    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejette une session d'un autre rôle", () => {
    const guard = new Guard();
    const context = makeContext(wrongRoleCookie(), freshIp());
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(invalidMessage);
  });

  it("rejette quand aucun cookie de session n'est présent", () => {
    const guard = new Guard();
    const context = makeContext({}, freshIp());
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it("verrouille l'IP après 5 échecs consécutifs, même avec une bonne session ensuite", () => {
    const guard = new Guard();
    const ip = freshIp();

    for (let i = 0; i < 5; i++) {
      expect(() => guard.canActivate(makeContext({}, ip))).toThrow(UnauthorizedException);
    }

    expect(() => guard.canActivate(makeContext(validCookie(), ip))).toThrow(/Trop de tentatives/);
  });

  it("une réussite remet le compteur d'échecs à zéro pour cette IP", () => {
    const guard = new Guard();
    const ip = freshIp();

    expect(() => guard.canActivate(makeContext({}, ip))).toThrow();
    expect(() => guard.canActivate(makeContext({}, ip))).toThrow();
    expect(() => guard.canActivate(makeContext(validCookie(), ip))).not.toThrow();

    for (let i = 0; i < 4; i++) {
      expect(() => guard.canActivate(makeContext({}, ip))).toThrow(invalidMessage);
    }
  });
});
