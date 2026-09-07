import { Body, Controller, Get, Headers, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../common/admin.guard";
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

  // Public pour les spectateurs (matricule admin optionnel → jeton hôte).
  @Get("live/room")
  getLiveRoom(@Headers("x-admin-matricule") adminMatricule?: string) {
    return this.service.getLiveRoom(adminMatricule);
  }
}
