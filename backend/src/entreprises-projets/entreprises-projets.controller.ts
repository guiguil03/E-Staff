import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EntreprisesProjetsService } from "./entreprises-projets.service";
import { CreateEntrepriseProjetDto } from "./create-entreprise-projet.dto";
import { UpdateEntrepriseProjetStatusDto } from "./update-entreprise-projet-status.dto";
import { RateLimitGuard } from "../common/rate-limit.guard";
import { RhGuard } from "../common/rh.guard";

@ApiTags("Entreprises")
@Controller()
export class EntreprisesProjetsController {
  constructor(private readonly service: EntreprisesProjetsService) {}

  @UseGuards(RateLimitGuard("entreprises-projets-create", 5))
  @Post("entreprises-projets")
  create(@Body() dto: CreateEntrepriseProjetDto) {
    return this.service.create(dto);
  }

  // ---- Portail RH ---------------------------------------------------------

  @UseGuards(RhGuard)
  @Get("rh/entreprises-projets")
  list() {
    return this.service.list();
  }

  @UseGuards(RhGuard)
  @Put("rh/entreprises-projets/:id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateEntrepriseProjetStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }
}
