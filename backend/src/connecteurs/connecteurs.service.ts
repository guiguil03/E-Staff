import { Injectable } from "@nestjs/common";
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
}
