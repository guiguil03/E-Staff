import { EntreprisesProjetsService } from "./entreprises-projets.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEntrepriseProjetDto } from "./create-entreprise-projet.dto";

describe("EntreprisesProjetsService", () => {
  it("horodate le consentement et ne persiste jamais le flag brut", async () => {
    const create = jest.fn().mockResolvedValue({ id: "p-1" });
    const service = new EntreprisesProjetsService({
      entrepriseProjet: { create },
    } as unknown as PrismaService);

    const dto: CreateEntrepriseProjetDto = {
      companyName: "Acme SARL",
      taxId: "STAT-123",
      sector: "Support client",
      address: "Antananarivo",
      country: "Madagascar",
      contactName: "Hery",
      contactRole: "DG",
      email: "hery@acme.mg",
      phone: "0340000000",
      serviceType: "Squad commerciale",
      teamSize: "10-20",
      startDate: "2026-11-01",
      needsDetails: "Externalisation d'une squad de 10 closers.",
      consent: true,
    };

    await service.create(dto);

    const { data } = create.mock.calls[0][0];
    expect(data.consentAt).toBeInstanceOf(Date);
    expect(data).not.toHaveProperty("consent");
    expect(data.companyName).toBe("Acme SARL");
  });
});
