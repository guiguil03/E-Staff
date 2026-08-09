import { Body, Controller, Post } from "@nestjs/common";
import { EntreprisesFormationsService } from "./entreprises-formations.service";
import { CreateEntrepriseFormationDto } from "./create-entreprise-formation.dto";

@Controller("entreprises-formations")
export class EntreprisesFormationsController {
  constructor(private readonly service: EntreprisesFormationsService) {}

  @Post()
  create(@Body() dto: CreateEntrepriseFormationDto) {
    return this.service.create(dto);
  }
}
