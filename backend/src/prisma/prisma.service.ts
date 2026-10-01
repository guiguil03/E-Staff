import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { enregistrerPrismaAntiAbus } from "../common/anti-abus";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    // Compteurs anti-abus et vérification des sessions en base (voir
    // common/anti-abus.ts, common/session.ts).
    enregistrerPrismaAntiAbus(this);
  }

  async onModuleDestroy() {
    enregistrerPrismaAntiAbus(null);
    await this.$disconnect();
  }
}
