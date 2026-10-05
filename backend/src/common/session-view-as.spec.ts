import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";
import { FormateurGuard } from "./formateur.guard";
import { signSession, VIEW_AS_COOKIE_NAME } from "./session";

process.env.JWT_SECRET = "test-secret";

function makeContext(cookies: Record<string, string | undefined>, ip: string) {
  const request: { cookies: typeof cookies; ip: string; headers: Record<string, string> } = {
    cookies,
    ip,
    headers: {},
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

// « Se connecter en tant que » ouvre le compte d'un formateur dans un autre
// onglet du MÊME navigateur : la session admin ne doit pas être écrasée.
describe("Session « en tant que » à côté de la session admin", () => {
  const admin = signSession({ matricule: "ADM-1", role: "admin" });
  const formateur = signSession({ matricule: "ETF-FORM-2026-0001", role: "formateur" });
  let n = 0;
  const ip = () => `10.77.0.${++n}`;

  it("les routes admin continuent d'accepter la session admin malgré une session formateur « en tant que »", async () => {
    const { context } = makeContext({ estaf_session: admin, [VIEW_AS_COOKIE_NAME]: formateur }, ip());
    await expect(new AdminGuard().canActivate(context)).resolves.toBe(true);
  });

  it("les routes formateur reçoivent la session « en tant que », pas celle de l'admin", async () => {
    const { context, request } = makeContext({ estaf_session: admin, [VIEW_AS_COOKIE_NAME]: formateur }, ip());
    await expect(new FormateurGuard().canActivate(context)).resolves.toBe(true);
    expect(request.headers["x-formateur-matricule"]).toBe("ETF-FORM-2026-0001");
  });

  it("une session « en tant que » seule ne donne aucun accès admin", async () => {
    const { context } = makeContext({ [VIEW_AS_COOKIE_NAME]: formateur }, ip());
    await expect(new AdminGuard().canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
