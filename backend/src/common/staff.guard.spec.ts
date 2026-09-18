import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { StaffGuard } from "./staff.guard";

function makeContext(headers: Record<string, string | undefined>, ip: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers, ip }),
    }),
  } as unknown as ExecutionContext;
}

describe("StaffGuard", () => {
  const originalAdmin = process.env.ADMIN_TEST_MATRICULE;
  const originalRh = process.env.RH_TEST_MATRICULE;
  let ipCounter = 0;

  function freshIp(): string {
    ipCounter += 1;
    return `10.99.1.${ipCounter}`;
  }

  beforeEach(() => {
    process.env.ADMIN_TEST_MATRICULE = "ADMIN-SECRET";
    process.env.RH_TEST_MATRICULE = "RH-SECRET";
  });

  afterEach(() => {
    if (originalAdmin === undefined) delete process.env.ADMIN_TEST_MATRICULE;
    else process.env.ADMIN_TEST_MATRICULE = originalAdmin;
    if (originalRh === undefined) delete process.env.RH_TEST_MATRICULE;
    else process.env.RH_TEST_MATRICULE = originalRh;
  });

  it("laisse passer avec le matricule admin valide", () => {
    const guard = new StaffGuard();
    expect(
      guard.canActivate(makeContext({ "x-admin-matricule": "ADMIN-SECRET" }, freshIp()))
    ).toBe(true);
  });

  it("laisse passer avec le matricule RH valide", () => {
    const guard = new StaffGuard();
    expect(
      guard.canActivate(makeContext({ "x-rh-matricule": "RH-SECRET" }, freshIp()))
    ).toBe(true);
  });

  it("rejette si aucun des deux matricules n'est valide", () => {
    const guard = new StaffGuard();
    expect(() =>
      guard.canActivate(
        makeContext({ "x-admin-matricule": "wrong", "x-rh-matricule": "wrong" }, freshIp())
      )
    ).toThrow(UnauthorizedException);
  });
});
