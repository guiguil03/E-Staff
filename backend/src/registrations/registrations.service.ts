import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRegistrationDto } from "./create-registration.dto";

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRegistrationDto) {
    return this.prisma.registration.create({ data: dto });
  }
}
