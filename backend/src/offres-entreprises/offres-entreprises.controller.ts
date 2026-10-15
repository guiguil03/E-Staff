import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RhGuard } from "../common/rh.guard";
import { OffresEntreprisesService } from "./offres-entreprises.service";
import {
  CreateLotDto,
  CreateMissionDto,
  UpdateLotDto,
  UpdateMissionDto,
} from "./dto/offres-entreprises.dto";

@ApiTags("Offres entreprises")
@Controller()
export class OffresEntreprisesController {
  constructor(private readonly service: OffresEntreprisesService) {}

  // Vitrine /entreprises — publique.
  @Get("entreprises/offres")
  listPubliques() {
    return this.service.listPubliques();
  }

  // ---- Portail RH ---------------------------------------------------------

  @UseGuards(RhGuard)
  @Get("rh/offres-entreprises/lots")
  listLots() {
    return this.service.listLots();
  }

  @UseGuards(RhGuard)
  @Post("rh/offres-entreprises/lots")
  createLot(@Body() dto: CreateLotDto) {
    return this.service.createLot(dto);
  }

  @UseGuards(RhGuard)
  @Put("rh/offres-entreprises/lots/:id")
  updateLot(@Param("id") id: string, @Body() dto: UpdateLotDto) {
    return this.service.updateLot(id, dto);
  }

  @UseGuards(RhGuard)
  @Delete("rh/offres-entreprises/lots/:id")
  removeLot(@Param("id") id: string) {
    return this.service.removeLot(id);
  }

  @UseGuards(RhGuard)
  @Get("rh/offres-entreprises/missions")
  listMissions() {
    return this.service.listMissions();
  }

  @UseGuards(RhGuard)
  @Post("rh/offres-entreprises/missions")
  createMission(@Body() dto: CreateMissionDto) {
    return this.service.createMission(dto);
  }

  @UseGuards(RhGuard)
  @Put("rh/offres-entreprises/missions/:id")
  updateMission(@Param("id") id: string, @Body() dto: UpdateMissionDto) {
    return this.service.updateMission(id, dto);
  }

  @UseGuards(RhGuard)
  @Delete("rh/offres-entreprises/missions/:id")
  removeMission(@Param("id") id: string) {
    return this.service.removeMission(id);
  }
}
