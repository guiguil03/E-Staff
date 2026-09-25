import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RhGuard } from "../common/rh.guard";
import { OffresEmploiService } from "./offres-emploi.service";
import { CreateOffreEmploiDto, UpdateOffreEmploiDto } from "./dto/offre-emploi.dto";

@ApiTags("Offres d'emploi")
@Controller()
export class OffresEmploiController {
  constructor(private readonly service: OffresEmploiService) {}

  // Vitrine Studio Métier — publique, comme le reste de la vitrine.
  @Get("offres-emploi")
  listPubliques() {
    return this.service.listPubliques();
  }

  // ---- Portail RH ---------------------------------------------------------

  @UseGuards(RhGuard)
  @Get("rh/offres-emploi")
  listAll() {
    return this.service.listAll();
  }

  @UseGuards(RhGuard)
  @Post("rh/offres-emploi")
  create(@Body() dto: CreateOffreEmploiDto) {
    return this.service.create(dto);
  }

  @UseGuards(RhGuard)
  @Put("rh/offres-emploi/:id")
  update(@Param("id") id: string, @Body() dto: UpdateOffreEmploiDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(RhGuard)
  @Delete("rh/offres-emploi/:id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
