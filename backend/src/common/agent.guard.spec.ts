import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AgentGuard } from "./agent.guard";
import { signSession } from "./session";

process.env.JWT_SECRET = "test-secret";

// Même squelette que apprenant.guard.spec.ts : ce qui compte ici c'est
// l'égalité session/URL (les matricules agents sont séquentiels, donc
// devinables — voir AgentGuard).
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

describe("AgentGuard", () => {
  let ipCounter = 0;

  function freshIp(): string {
    ipCounter += 1;
    return `10.99.7.${ipCounter}`;
  }

  it("laisse passer quand la session correspond exactement au matricule de l'URL", async () => {
    const guard = new AgentGuard();
    const context = makeContext(
      { estaf_session: signSession({ matricule: "ETF-AG-2026-0001", role: "agent" }) },
      { matricule: "ETF-AG-2026-0001" },
      freshIp()
    );
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("rejette quand la session est celle d'un AUTRE agent (IDOR sur la paie)", async () => {
    const guard = new AgentGuard();
    const context = makeContext(
      { estaf_session: signSession({ matricule: "ETF-AG-2026-0001", role: "agent" }) },
      { matricule: "ETF-AG-2026-0002" },
      freshIp()
    );
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejette une session d'un autre rôle", async () => {
    const guard = new AgentGuard();
    const context = makeContext(
      { estaf_session: signSession({ matricule: "ETF-AG-2026-0001", role: "apprenant" }) },
      { matricule: "ETF-AG-2026-0001" },
      freshIp()
    );
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("accepte la session « se connecter en tant que » posée dans le cookie dédié", async () => {
    const guard = new AgentGuard();
    const context = makeContext(
      {
        estaf_session: signSession({ matricule: "RH-2026-0001", role: "rh" }),
        estaf_session_va: signSession({ matricule: "ETF-AG-2026-0001", role: "agent" }),
      },
      { matricule: "ETF-AG-2026-0001" },
      freshIp()
    );
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("rejette quand aucun cookie de session n'est présent", async () => {
    const guard = new AgentGuard();
    const context = makeContext({}, { matricule: "ETF-AG-2026-0001" }, freshIp());
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
