import type { PrismaClient } from "@prisma/client";
import { enregistrerPrismaAntiAbus } from "./anti-abus";
import { identifiantPartageAutorise, sessionToujoursValide } from "./session";

// Vérification des sessions en base (audit du 2026-09-28).
function prismaMock() {
  return {
    formateur: { findUnique: jest.fn() },
    apprenant: { findUnique: jest.fn() },
    compteStaff: { findUnique: jest.fn(), count: jest.fn() },
  };
}

describe("sessionToujoursValide", () => {
  let prisma: ReturnType<typeof prismaMock>;
  const maintenant = Math.floor(Date.now() / 1000);

  beforeEach(() => {
    prisma = prismaMock();
    enregistrerPrismaAntiAbus(prisma as unknown as PrismaClient);
    process.env.RH_TEST_MATRICULE = "RH-TEST";
  });
  afterEach(() => enregistrerPrismaAntiAbus(null));

  it("refuse une session émise avant « Déconnecter partout »", async () => {
    prisma.formateur.findUnique.mockResolvedValue({ sessionsRevoqueesAt: new Date() });
    await expect(
      sessionToujoursValide({ matricule: "ETF-FORM-2026-0001", role: "formateur", iat: maintenant - 3600 })
    ).resolves.toBe(false);
  });

  it("refuse une session émise dans la même seconde, juste avant la révocation", async () => {
    const emis = Date.now();
    prisma.formateur.findUnique.mockResolvedValue({ sessionsRevoqueesAt: new Date(emis + 5) });
    await expect(
      sessionToujoursValide({ matricule: "ETF-FORM-2026-0001", role: "formateur", iat: Math.floor(emis / 1000), emis })
    ).resolves.toBe(false);
  });

  it("accepte une session émise après la révocation", async () => {
    prisma.apprenant.findUnique.mockResolvedValue({ sessionsRevoqueesAt: new Date(Date.now() - 3600_000) });
    await expect(
      sessionToujoursValide({ matricule: "ETF-2026-0001", role: "apprenant", iat: maintenant })
    ).resolves.toBe(true);
  });

  it("refuse un compte supprimé", async () => {
    prisma.apprenant.findUnique.mockResolvedValue(null);
    await expect(sessionToujoursValide({ matricule: "ETF-2026-0009", role: "apprenant", iat: maintenant })).resolves.toBe(false);
  });

  it("refuse un compte Admin/RH désactivé", async () => {
    prisma.compteStaff.findUnique.mockResolvedValue({ actif: false, role: "rh", sessionsRevoqueesAt: null });
    await expect(sessionToujoursValide({ matricule: "RH-2026-0001", role: "rh", iat: maintenant })).resolves.toBe(false);
  });

  it("refuse l'identifiant RH partagé dès qu'un compte RH nominatif actif existe", async () => {
    prisma.compteStaff.findUnique.mockResolvedValue(null);
    prisma.compteStaff.count.mockResolvedValue(1);
    await expect(sessionToujoursValide({ matricule: "RH-TEST", role: "rh", iat: maintenant })).resolves.toBe(false);
    await expect(identifiantPartageAutorise("rh")).resolves.toBe(false);
  });

  it("accepte l'identifiant RH partagé tant qu'aucun compte nominatif n'existe", async () => {
    prisma.compteStaff.findUnique.mockResolvedValue(null);
    prisma.compteStaff.count.mockResolvedValue(0);
    await expect(sessionToujoursValide({ matricule: "RH-TEST", role: "rh", iat: maintenant })).resolves.toBe(true);
  });
});
