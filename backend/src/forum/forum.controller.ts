import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AdminGuard } from "../common/admin.guard";
import { ApprenantOuAdminGuard } from "../common/apprenant-ou-admin.guard";
import { verifierSession } from "../common/session";
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

  // Réservé aux apprenants (spectateurs) et aux admins (hôtes) — avant,
  // seul un filtre sessionStorage côté front (ForumAccessGate) protégeait
  // cette route, trivialement contournable (n'importe qui obtenait un
  // jeton spectateur valide pour la salle Daily). Le jeton hôte n'est
  // accordé que si l'appelant a une vraie session admin signée (voir
  // common/session.ts) — avant, un simple header `x-admin-matricule`
  // auto-déclaré suffisait : n'importe qui connaissant (ou devinant) ce
  // matricule pouvait se faire passer pour l'hôte du Live.
  @Get("live/room")
  @UseGuards(ApprenantOuAdminGuard)
  async getLiveRoom(@Req() request: Request) {
    const isAdmin = (await verifierSession(request))?.role === "admin";
    return this.service.getLiveRoom(isAdmin);
  }
}
