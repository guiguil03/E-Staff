import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { FormateurGuard } from "../common/formateur.guard";
import { CockpitService } from "./cockpit.service";
import { SetAbonnementDto } from "./dto/set-abonnement.dto";

// Agrégats réels du Cockpit Formateur (Vivier C1, moyennes de groupe,
// courbe d'évolution, rapport hebdo) — voir cockpit.service.ts pour les
// conventions de calcul et ce qui reste volontairement hors périmètre
// (Alertes Paiements, en attente d'un modèle d'abonnement).
@Controller("cockpit")
@UseGuards(FormateurGuard)
export class CockpitController {
  constructor(private readonly service: CockpitService) {}

  @Get("groupes")
  getGroupes() {
    return this.service.getGroupes();
  }

  @Get("groupes/:cle/detail")
  getGroupeDetail(@Param("cle") cle: string) {
    return this.service.getGroupeDetail(cle);
  }

  @Get("vivier-c1")
  getVivierC1() {
    return this.service.getVivierC1();
  }

  @Get("evolution")
  getEvolution() {
    return this.service.getEvolution();
  }

  @Get("rapport-hebdo")
  getRapportHebdo() {
    return this.service.getRapportHebdo();
  }

  @Get("paiements")
  getPaiements() {
    return this.service.getPaiements();
  }

  @Put("apprenants/:matricule/abonnement")
  setAbonnement(@Param("matricule") matricule: string, @Body() dto: SetAbonnementDto) {
    return this.service.setAbonnementExpireAt(matricule, new Date(dto.expireAt));
  }
}
