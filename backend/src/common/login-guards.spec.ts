import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";
import { TrainerGuard } from "./trainer.guard";

// AdminGuard, FormateurGuard et TrainerGuard partagent le même squelette
// (secret partagé par header + anti-brute-force via login-rate-limit.ts) —
// un seul fichier paramétré plutôt que 3 fichiers quasi identiques, un cas
// par guard suffit à couvrir la logique propre à chacun (nom du header/de
// la var d'env, message d'erreur). FormateurGuard accepte en plus un vrai
// matricule en base (voir formateur.guard.ts) — reçoit donc un Prisma mocké
// dont `formateur.findUnique` renvoie null par défaut, pour se comporter ici
// exactement comme les deux autres guards (secret partagé uniquement) ; le
// chemin "vrai formateur en base" a son propre test plus bas.
// canActivate peut être sync (Admin/Trainer) ou async (Formateur, qui
// interroge Prisma) — on enveloppe systématiquement dans une promesse pour
// tester les deux avec les mêmes assertions .resolves/.rejects.
function makeContext(headers: Record<string, string | undefined>, ip: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers, ip }),
    }),
  } as unknown as ExecutionContext;
}

function activate(guard: { canActivate(ctx: ExecutionContext): boolean | Promise<boolean> }, context: ExecutionContext) {
  return Promise.resolve().then(() => guard.canActivate(context));
}

const formateurFindUniqueMock = jest.fn().mockResolvedValue(null);
const prismaStub = { formateur: { findUnique: formateurFindUniqueMock } };

const cases = [
  {
    name: "AdminGuard",
    makeGuard: () => new AdminGuard(),
    header: "x-admin-matricule",
    envVar: "ADMIN_TEST_MATRICULE",
    invalidMessage: "Matricule admin invalide.",
    keyPrefix: "admin",
  },
  {
    name: "FormateurGuard",
    makeGuard: () => new FormateurGuard(prismaStub as any),
    header: "x-formateur-matricule",
    envVar: "FORMATEUR_TEST_MATRICULE",
    invalidMessage: "Matricule formateur invalide.",
    keyPrefix: "formateur",
  },
  {
    name: "TrainerGuard",
    makeGuard: () => new TrainerGuard(),
    header: "x-trainer-code",
    envVar: "TRAINER_ACCESS_CODE",
    invalidMessage: "Code formateur invalide.",
    keyPrefix: "trainer",
  },
];

describe.each(cases)("$name", ({ makeGuard, header, envVar, invalidMessage, keyPrefix }) => {
  const originalEnv = process.env[envVar];
  let ipCounter = 0;

  function freshIp(): string {
    ipCounter += 1;
    return `10.${keyPrefix.length}.0.${ipCounter}`;
  }

  beforeEach(() => {
    formateurFindUniqueMock.mockClear();
    formateurFindUniqueMock.mockResolvedValue(null);
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env[envVar];
    else process.env[envVar] = originalEnv;
  });

  it("laisse passer quand le secret envoyé correspond à la variable d'env", async () => {
    process.env[envVar] = "SECRET-123";
    const guard = makeGuard();
    const context = makeContext({ [header]: "SECRET-123" }, freshIp());
    await expect(activate(guard, context)).resolves.toBe(true);
  });

  it("rejette quand le secret envoyé ne correspond pas", async () => {
    process.env[envVar] = "SECRET-123";
    const guard = makeGuard();
    const context = makeContext({ [header]: "wrong" }, freshIp());
    await expect(activate(guard, context)).rejects.toThrow(UnauthorizedException);
    await expect(activate(guard, context)).rejects.toThrow(invalidMessage);
  });

  it("rejette quand la variable d'env n'est pas configurée, même sans header", async () => {
    delete process.env[envVar];
    const guard = makeGuard();
    const context = makeContext({}, freshIp());
    await expect(activate(guard, context)).rejects.toThrow(UnauthorizedException);
  });

  it("verrouille l'IP après 5 échecs consécutifs, même avec le bon secret ensuite", async () => {
    process.env[envVar] = "SECRET-123";
    const guard = makeGuard();
    const ip = freshIp();

    for (let i = 0; i < 5; i++) {
      await expect(activate(guard, makeContext({ [header]: "wrong" }, ip))).rejects.toThrow(
        UnauthorizedException
      );
    }

    await expect(activate(guard, makeContext({ [header]: "SECRET-123" }, ip))).rejects.toThrow(
      /Trop de tentatives/
    );
  });

  it("une réussite remet le compteur d'échecs à zéro pour cette IP", async () => {
    process.env[envVar] = "SECRET-123";
    const guard = makeGuard();
    const ip = freshIp();

    await expect(activate(guard, makeContext({ [header]: "wrong" }, ip))).rejects.toThrow();
    await expect(activate(guard, makeContext({ [header]: "wrong" }, ip))).rejects.toThrow();
    await expect(activate(guard, makeContext({ [header]: "SECRET-123" }, ip))).resolves.toBe(true);

    for (let i = 0; i < 4; i++) {
      await expect(activate(guard, makeContext({ [header]: "wrong" }, ip))).rejects.toThrow(
        invalidMessage
      );
    }
  });
});

describe("FormateurGuard — matricule réel en base", () => {
  const originalEnv = process.env.FORMATEUR_TEST_MATRICULE;
  let ipCounter = 0;

  function freshIp(): string {
    ipCounter += 1;
    return `10.99.0.${ipCounter}`;
  }

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.FORMATEUR_TEST_MATRICULE;
    else process.env.FORMATEUR_TEST_MATRICULE = originalEnv;
    formateurFindUniqueMock.mockReset();
  });

  it("accepte un matricule qui existe en base, même différent du compte de test", async () => {
    process.env.FORMATEUR_TEST_MATRICULE = "ETF-FORM-2026-0001";
    formateurFindUniqueMock.mockResolvedValue({ id: "f1", matricule: "ETF-FORM-2026-0007" });
    const guard = new FormateurGuard(prismaStub as any);
    const context = makeContext({ "x-formateur-matricule": "ETF-FORM-2026-0007" }, freshIp());

    await expect(activate(guard, context)).resolves.toBe(true);
    expect(formateurFindUniqueMock).toHaveBeenCalledWith({
      where: { matricule: "ETF-FORM-2026-0007" },
    });
  });

  it("rejette un matricule qui n'existe ni comme compte de test ni en base", async () => {
    process.env.FORMATEUR_TEST_MATRICULE = "ETF-FORM-2026-0001";
    formateurFindUniqueMock.mockResolvedValue(null);
    const guard = new FormateurGuard(prismaStub as any);
    const context = makeContext({ "x-formateur-matricule": "ETF-FORM-2026-9999" }, freshIp());

    await expect(activate(guard, context)).rejects.toThrow("Matricule formateur invalide.");
  });
});
