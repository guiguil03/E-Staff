import { Module } from "@nestjs/common";
import { ConnecteursController } from "./connecteurs.controller";
import { ConnecteursService } from "./connecteurs.service";

@Module({
  controllers: [ConnecteursController],
  providers: [ConnecteursService],
})
export class ConnecteursModule {}
