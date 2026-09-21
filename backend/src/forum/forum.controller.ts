import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AdminGuard } from "../common/admin.guard";
import { readSession } from "../common/session";
import { ForumService } from "./forum.service";
import { UpsertForumLiveDto } from "./dto/upsert-forum-live.dto";

@ApiTags("Forum")
@Controller("forum")
export class ForumController {
  constructor(private readonly service: ForumService) {}

  @Get("lives")
  @UseGuards(AdminGuard)
  listLives() {
    return this.service.listLives();
  }

  @Post("lives")
  @UseGuards(AdminGuard)
  createLive(@Body() dto: UpsertForumLiveDto) {
    return this.service.createLive(dto);
  }

  @Put("lives/:id")
  @UseGuards(AdminGuard)
  updateLive(@Param("id") id: string, @Body() dto: UpsertForumLiveDto) {
    return this.service.updateLive(id, dto);
  }

  // Public — affiché sur /forum, pas de lien de salle ici.
  @Get("live/prochain")
  getProchainLive() {
    return this.service.getProchainLive();
  }

  // Public pour les spectateurs — jeton hôte seulement si l'appelant a une
  // vraie session admin signée (voir common/session.ts). Avant, un simple
  // header `x-admin-matricule` auto-déclaré suffisait à obtenir le jeton
  // hôte : n'importe qui connaissant (ou devinant) ce matricule pouvait se
  // faire passer pour l'hôte du Live.
  @Get("live/room")
  getLiveRoom(@Req() request: Request) {
    const isAdmin = readSession(request)?.role === "admin";
    return this.service.getLiveRoom(isAdmin);
  }
}
