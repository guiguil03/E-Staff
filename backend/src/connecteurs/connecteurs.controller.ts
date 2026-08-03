import { Body, Controller, Post } from "@nestjs/common";
import { ConnecteursService } from "./connecteurs.service";
import { CreateConnecteurDto } from "./create-connecteur.dto";

@Controller("connecteurs")
export class ConnecteursController {
  constructor(private readonly service: ConnecteursService) {}

  @Post()
  create(@Body() dto: CreateConnecteurDto) {
    return this.service.create(dto);
  }
}
