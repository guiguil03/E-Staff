import { Injectable } from "@nestjs/common";
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
}
