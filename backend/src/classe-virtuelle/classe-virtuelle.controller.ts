import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from "@nestjs/common";
import { FormateurGuard } from "../common/formateur.guard";
import { ClasseVirtuelleService } from "./classe-virtuelle.service";
import { UpsertSeanceDto } from "./dto/upsert-seance.dto";

@Controller()
export class ClasseVirtuelleController {
  constructor(private readonly service: ClasseVirtuelleService) {}

  @Get("seances/:groupeCle/:numero")
  @UseGuards(FormateurGuard)
  getSeance(@Param("groupeCle") groupeCle: string, @Param("numero", ParseIntPipe) numero: number) {
    return this.service.getSeance(groupeCle, numero);
  }

  @Put("seances/:groupeCle/:numero")
  @UseGuards(FormateurGuard)
  upsertSeance(
    @Param("groupeCle") groupeCle: string,
    @Param("numero", ParseIntPipe) numero: number,
    @Body() dto: UpsertSeanceDto
  ) {
    return this.service.upsertSeance(groupeCle, numero, dto);
  }

  @Get("seances/:groupeCle/:numero/room")
  @UseGuards(FormateurGuard)
  getSeanceRoom(@Param("groupeCle") groupeCle: string, @Param("numero", ParseIntPipe) numero: number) {
    return this.service.getSeanceRoom(groupeCle, numero);
  }

  @Get("formateurs/prochaine-seance")
  @UseGuards(FormateurGuard)
  getFormateurProchaineSeance() {
    return this.service.getFormateurProchaineSeance();
  }

  // Pas de guard : le matricule apprenant joue ici le même rôle qu'ailleurs
  // dans le stopgap actuel (identifiant, pas un secret fort) — cohérent
  // avec le niveau de protection du reste du Compte Apprenant, qui n'a pas
  // encore d'appel backend gardé.
  @Get("apprenants/:matricule/prochaine-seance-room")
  getApprenantProchaineSeanceRoom(@Param("matricule") matricule: string) {
    return this.service.getApprenantProchaineSeanceRoom(matricule);
  }
}
