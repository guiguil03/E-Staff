import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEntrepriseProjetDto } from "./create-entreprise-projet.dto";

@Injectable()
export class EntreprisesProjetsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEntrepriseProjetDto) {
    const { consent, ...rest } = dto;
    return this.prisma.entrepriseProjet.create({
      data: {
        ...rest,
        consentAt: new Date(),
      },
    });
  }

  list() {
    return this.prisma.entrepriseProjet.findMany({ orderBy: { createdAt: "desc" } });
  }

  async updateStatus(id: string, status: string) {
    const existing = await this.prisma.entrepriseProjet.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Demande introuvable.");
    return this.prisma.entrepriseProjet.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    const existing = await this.prisma.entrepriseProjet.findUnique({
      where: { id },
      include: { _count: { select: { contratsB2B: true } } },
    });
    if (!existing) throw new NotFoundException("Demande introuvable.");
    if (existing._count.contratsB2B > 0) {
      throw new ConflictException(
        "Cette demande est rattachée à un contrat B2B : suppression impossible."
      );
    }
    await this.prisma.entrepriseProjet.delete({ where: { id } });
    return { ok: true };
  }
}
