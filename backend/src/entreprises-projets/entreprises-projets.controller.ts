import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EntreprisesProjetsService } from "./entreprises-projets.service";
import { CreateEntrepriseProjetDto } from "./create-entreprise-projet.dto";

@ApiTags("Entreprises")
@Controller("entreprises-projets")
export class EntreprisesProjetsController {
  constructor(private readonly service: EntreprisesProjetsService) {}

  @Post()
  create(@Body() dto: CreateEntrepriseProjetDto) {
    return this.service.create(dto);
  }
}
