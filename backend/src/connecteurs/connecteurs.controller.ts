import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConnecteursService } from "./connecteurs.service";
import { CreateConnecteurDto } from "./create-connecteur.dto";
import { RateLimitGuard } from "../common/rate-limit.guard";

@ApiTags("Connecteurs")
@Controller("connecteurs")
export class ConnecteursController {
  constructor(private readonly service: ConnecteursService) {}

  @UseGuards(RateLimitGuard("connecteurs-create", 5))
  @Post()
  create(@Body() dto: CreateConnecteurDto) {
    return this.service.create(dto);
  }
}
