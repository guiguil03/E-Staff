import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EntreprisesFormationsService } from "./entreprises-formations.service";
import { CreateEntrepriseFormationDto } from "./create-entreprise-formation.dto";
import { RateLimitGuard } from "../common/rate-limit.guard";

@ApiTags("Entreprises")
@Controller("entreprises-formations")
export class EntreprisesFormationsController {
  constructor(private readonly service: EntreprisesFormationsService) {}

  @UseGuards(RateLimitGuard("entreprises-formations-create", 5))
  @Post()
  create(@Body() dto: CreateEntrepriseFormationDto) {
    return this.service.create(dto);
  }
}
