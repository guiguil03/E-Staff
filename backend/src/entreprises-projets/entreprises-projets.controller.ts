import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EntreprisesProjetsService } from "./entreprises-projets.service";
import { CreateEntrepriseProjetDto } from "./create-entreprise-projet.dto";
import { RateLimitGuard } from "../common/rate-limit.guard";

@ApiTags("Entreprises")
@Controller("entreprises-projets")
export class EntreprisesProjetsController {
  constructor(private readonly service: EntreprisesProjetsService) {}

  @UseGuards(RateLimitGuard("entreprises-projets-create", 5))
  @Post()
  create(@Body() dto: CreateEntrepriseProjetDto) {
    return this.service.create(dto);
  }
}
