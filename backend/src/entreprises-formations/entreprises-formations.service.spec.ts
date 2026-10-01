import { EntreprisesFormationsService } from "./entreprises-formations.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEntrepriseFormationDto } from "./create-entreprise-formation.dto";

describe("EntreprisesFormationsService", () => {
  it("horodate le consentement et ne persiste jamais le flag brut", async () => {
    const create = jest.fn().mockResolvedValue({ id: "e-1" });
    const service = new EntreprisesFormationsService({
      entrepriseFormation: { create },
    } as unknown as PrismaService);

    const dto: CreateEntrepriseFormationDto = {
      companyName: "Acme SARL",
      contactName: "Hery",
      email: "hery@acme.mg",
      phone: "0340000000",
      secteur: "centres-appels",
      effectif: "10-50",
      motif: "audit",
      consent: true,
    };

    await service.create(dto);

    const { data } = create.mock.calls[0][0];
    expect(data.consentAt).toBeInstanceOf(Date);
    expect(data).not.toHaveProperty("consent");
    expect(data.companyName).toBe("Acme SARL");
  });
});
