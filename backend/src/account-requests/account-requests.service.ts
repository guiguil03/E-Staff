import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAccountRequestDto } from "./create-account-request.dto";

@Injectable()
export class AccountRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAccountRequestDto) {
    return this.prisma.accountRequest.create({ data: dto });
  }
}
