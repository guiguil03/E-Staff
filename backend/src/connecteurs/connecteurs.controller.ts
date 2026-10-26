import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConnecteursService } from "./connecteurs.service";
import { CreateConnecteurDto } from "./create-connecteur.dto";
import { UpdateConnecteurStatusDto } from "./update-connecteur-status.dto";
import { RateLimitGuard } from "../common/rate-limit.guard";
import { RhGuard } from "../common/rh.guard";

@ApiTags("Connecteurs")
@Controller()
export class ConnecteursController {
  constructor(private readonly service: ConnecteursService) {}

  @UseGuards(RateLimitGuard("connecteurs-create", 5))
  @Post("connecteurs")
  create(@Body() dto: CreateConnecteurDto) {
    return this.service.create(dto);
  }

  // ---- Portail RH ---------------------------------------------------------

  @UseGuards(RhGuard)
  @Get("rh/connecteurs")
  list() {
    return this.service.list();
  }

  @UseGuards(RhGuard)
  @Put("rh/connecteurs/:id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateConnecteurStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }

  @UseGuards(RhGuard)
  @Delete("rh/connecteurs/:id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
