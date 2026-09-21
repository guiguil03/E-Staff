import { AccountRequestsService } from "./account-requests.service";
import { PrismaService } from "../prisma/prisma.service";

describe("AccountRequestsService", () => {
  it("transmet la demande telle quelle à Prisma", async () => {
    const create = jest.fn().mockResolvedValue({ id: "ar-1" });
    const service = new AccountRequestsService({ accountRequest: { create } } as unknown as PrismaService);

    const dto = { role: "formateur", firstName: "Fara", email: "fara@example.com", phone: "0340000000" };
    await service.create(dto);

    expect(create).toHaveBeenCalledWith({ data: dto });
  });
});
