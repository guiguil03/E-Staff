import { Module } from "@nestjs/common";
import { EntreprisesFormationsController } from "./entreprises-formations.controller";
import { EntreprisesFormationsService } from "./entreprises-formations.service";

@Module({
  controllers: [EntreprisesFormationsController],
  providers: [EntreprisesFormationsService],
})
export class EntreprisesFormationsModule {}
