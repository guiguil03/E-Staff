import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { FormateurGuard } from "./formateur.guard";
import { PrismaService } from "../prisma/prisma.service";

function makeContext(headers: Record<string, string | undefined>, ip: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers, ip }),
    }),
  } as unknown as ExecutionContext;
}

describe("FormateurGuard", () => {
  let findUnique: jest.Mock;
  let ipCounter = 0;

  function freshIp(): string {
    ipCounter += 1;
    return `10.99.0.${ipCounter}`;
  }

  function makeGuard() {
    findUnique = jest.fn();
    const prisma = { formateur: { findUnique } };
    return new FormateurGuard(prisma as unknown as PrismaService);
  }

  it("laisse passer quand le matricule correspond à un formateur existant", async () => {
    const guard = makeGuard();
    findUnique.mockResolvedValue({ id: "f-1", matricule: "ETF-FORM-2026-0001" });
    const context = makeContext({ "x-formateur-matricule": "ETF-FORM-2026-0001" }, freshIp());
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("rejette un matricule qui n'existe pas en base", async () => {
    const guard = makeGuard();
    findUnique.mockResolvedValue(null);
    const context = makeContext({ "x-formateur-matricule": "inconnu" }, freshIp());
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow("Matricule formateur invalide.");
  });

  it("rejette quand le header est absent, sans interroger la base", async () => {
    const guard = makeGuard();
    const context = makeContext({}, freshIp());
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("verrouille l'IP après 5 échecs consécutifs, même avec un matricule valide ensuite", async () => {
    const guard = makeGuard();
    findUnique.mockResolvedValue(null);
    const ip = freshIp();

    for (let i = 0; i < 5; i++) {
      await expect(
        guard.canActivate(makeContext({ "x-formateur-matricule": "inconnu" }, ip))
      ).rejects.toThrow(UnauthorizedException);
    }

    findUnique.mockResolvedValue({ id: "f-1", matricule: "ETF-FORM-2026-0001" });
    await expect(
      guard.canActivate(makeContext({ "x-formateur-matricule": "ETF-FORM-2026-0001" }, ip))
    ).rejects.toThrow(/Trop de tentatives/);
  });

  it("une réussite remet le compteur d'échecs à zéro pour cette IP", async () => {
    const guard = makeGuard();
    const ip = freshIp();

    findUnique.mockResolvedValue(null);
    await expect(
      guard.canActivate(makeContext({ "x-formateur-matricule": "inconnu" }, ip))
    ).rejects.toThrow();
    await expect(
      guard.canActivate(makeContext({ "x-formateur-matricule": "inconnu" }, ip))
    ).rejects.toThrow();

    findUnique.mockResolvedValue({ id: "f-1", matricule: "ETF-FORM-2026-0001" });
    await expect(
      guard.canActivate(makeContext({ "x-formateur-matricule": "ETF-FORM-2026-0001" }, ip))
    ).resolves.toBe(true);

    findUnique.mockResolvedValue(null);
    for (let i = 0; i < 4; i++) {
      await expect(
        guard.canActivate(makeContext({ "x-formateur-matricule": "inconnu" }, ip))
      ).rejects.toThrow("Matricule formateur invalide.");
    }
  });
});
