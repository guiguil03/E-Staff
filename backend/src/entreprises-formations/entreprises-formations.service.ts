import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEntrepriseFormationDto } from "./create-entreprise-formation.dto";

@Injectable()
export class EntreprisesFormationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEntrepriseFormationDto) {
    const { consent, ...rest } = dto;
    return this.prisma.entrepriseFormation.create({
      data: {
        ...rest,
        consentAt: new Date(),
      },
    });
  }
}
