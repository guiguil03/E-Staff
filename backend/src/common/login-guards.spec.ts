import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";
import { TrainerGuard } from "./trainer.guard";

// AdminGuard et TrainerGuard partagent exactement le même squelette (secret
// partagé par header + anti-brute-force via login-rate-limit.ts) — un seul
// fichier paramétré plutôt que 2 fichiers quasi identiques, un cas par
// guard suffit à couvrir la logique propre à chacun (nom du header/de la
// var d'env, message d'erreur). FormateurGuard a son propre fichier
// (formateur.guard.spec.ts) depuis qu'il vérifie un vrai compte en base
// plutôt qu'un secret partagé — squelette différent (async, Prisma).
function makeContext(headers: Record<string, string | undefined>, ip: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers, ip }),
    }),
  } as unknown as ExecutionContext;
}

const cases = [
  {
    name: "AdminGuard",
    Guard: AdminGuard,
    header: "x-admin-matricule",
    envVar: "ADMIN_TEST_MATRICULE",
    invalidMessage: "Matricule admin invalide.",
    keyPrefix: "admin",
  },
  {
    name: "TrainerGuard",
    Guard: TrainerGuard,
    header: "x-trainer-code",
    envVar: "TRAINER_ACCESS_CODE",
    invalidMessage: "Code formateur invalide.",
    keyPrefix: "trainer",
  },
];

describe.each(cases)("$name", ({ Guard, header, envVar, invalidMessage, keyPrefix }) => {
  const originalEnv = process.env[envVar];
  let ipCounter = 0;

  function freshIp(): string {
    ipCounter += 1;
    return `10.${keyPrefix.length}.0.${ipCounter}`;
  }

  afterEach(() => {
    if (originalEnv === undefined) delete process.env[envVar];
    else process.env[envVar] = originalEnv;
  });

  it("laisse passer quand le secret envoyé correspond à la variable d'env", () => {
    process.env[envVar] = "SECRET-123";
    const guard = new Guard();
    const context = makeContext({ [header]: "SECRET-123" }, freshIp());
    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejette quand le secret envoyé ne correspond pas", () => {
    process.env[envVar] = "SECRET-123";
    const guard = new Guard();
    const context = makeContext({ [header]: "wrong" }, freshIp());
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(invalidMessage);
  });

  it("rejette quand la variable d'env n'est pas configurée, même sans header", () => {
    delete process.env[envVar];
    const guard = new Guard();
    const context = makeContext({}, freshIp());
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it("verrouille l'IP après 5 échecs consécutifs, même avec le bon secret ensuite", () => {
    process.env[envVar] = "SECRET-123";
    const guard = new Guard();
    const ip = freshIp();

    for (let i = 0; i < 5; i++) {
      expect(() => guard.canActivate(makeContext({ [header]: "wrong" }, ip))).toThrow(
        UnauthorizedException
      );
    }

    expect(() => guard.canActivate(makeContext({ [header]: "SECRET-123" }, ip))).toThrow(
      /Trop de tentatives/
    );
  });

  it("une réussite remet le compteur d'échecs à zéro pour cette IP", () => {
    process.env[envVar] = "SECRET-123";
    const guard = new Guard();
    const ip = freshIp();

    expect(() => guard.canActivate(makeContext({ [header]: "wrong" }, ip))).toThrow();
    expect(() => guard.canActivate(makeContext({ [header]: "wrong" }, ip))).toThrow();
    expect(() => guard.canActivate(makeContext({ [header]: "SECRET-123" }, ip))).not.toThrow();

    for (let i = 0; i < 4; i++) {
      expect(() => guard.canActivate(makeContext({ [header]: "wrong" }, ip))).toThrow(
        invalidMessage
      );
    }
  });
});
