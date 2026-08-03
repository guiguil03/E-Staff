import { Module } from "@nestjs/common";
import { EntreprisesProjetsController } from "./entreprises-projets.controller";
import { EntreprisesProjetsService } from "./entreprises-projets.service";

@Module({
  controllers: [EntreprisesProjetsController],
  providers: [EntreprisesProjetsService],
})
export class EntreprisesProjetsModule {}
