import { ConnecteursService } from "./connecteurs.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateConnecteurDto } from "./create-connecteur.dto";

describe("ConnecteursService", () => {
  it("encode soughtRoles en JSON avant de créer le connecteur", async () => {
    const create = jest.fn().mockResolvedValue({ id: "c-1" });
    const service = new ConnecteursService({ connecteur: { create } } as unknown as PrismaService);

    const dto: CreateConnecteurDto = {
      firstName: "Nirina",
      lastName: "R.",
      email: "nirina@example.com",
      phone: "0340000000",
      activityType: "Cabinet recrutement",
      clientCount: "5-15",
      soughtRoles: ["Closer", "Support client"],
      cvVolume: "50-200",
      budgetPerAgent: "500-1000€",
      presentationMode: "RDV à trois",
      paymentChannel: "Virement",
      opportunityTiming: "Oui immédiat",
    };

    await service.create(dto);

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        firstName: "Nirina",
        soughtRoles: JSON.stringify(["Closer", "Support client"]),
      }),
    });
  });
});
