import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateConnecteurDto } from "./create-connecteur.dto";

@Injectable()
export class ConnecteursService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateConnecteurDto) {
    const { soughtRoles, ...rest } = dto;
    return this.prisma.connecteur.create({
      data: {
        ...rest,
        soughtRoles: JSON.stringify(soughtRoles),
      },
    });
  }

  list() {
    return this.prisma.connecteur.findMany({ orderBy: { createdAt: "desc" } });
  }

  async updateStatus(id: string, status: string) {
    const existing = await this.prisma.connecteur.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Connecteur introuvable.");
    return this.prisma.connecteur.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    const existing = await this.prisma.connecteur.findUnique({
      where: { id },
      include: {
        _count: {
          select: { apprenantsApportes: true, contratsApportes: true, commissionsDemarrage: true },
        },
      },
    });
    if (!existing) throw new NotFoundException("Connecteur introuvable.");
    const { apprenantsApportes, contratsApportes, commissionsDemarrage } = existing._count;
    if (apprenantsApportes + contratsApportes + commissionsDemarrage > 0) {
      throw new ConflictException(
        "Ce connecteur a des apprenants, contrats ou commissions rattachés : suppression impossible."
      );
    }
    await this.prisma.connecteur.delete({ where: { id } });
    return { ok: true };
  }
}
