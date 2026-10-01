import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AdminGuard } from "../common/admin.guard";
import { readSession } from "../common/session";
import { ComptesStaffService } from "./comptes-staff.service";
import { CreateCompteStaffDto, SetActifDto } from "./comptes-staff.dto";

// Paramètres > Comptes d'accès — réservé à l'admin.
@ApiTags("Comptes staff")
@Controller("comptes-staff")
@UseGuards(AdminGuard)
export class ComptesStaffController {
  constructor(private readonly service: ComptesStaffService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() dto: CreateCompteStaffDto) {
    return this.service.create(dto);
  }

  @Put(":id/actif")
  setActif(@Param("id") id: string, @Body() dto: SetActifDto, @Req() request: Request) {
    return this.service.setActif(id, dto.actif, readSession(request)?.matricule ?? "");
  }

  @Post(":id/regenerer-mot-de-passe")
  regenerer(@Param("id") id: string) {
    return this.service.regenererMotDePasse(id);
  }
}
