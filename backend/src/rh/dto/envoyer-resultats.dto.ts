import { IsIn } from "class-validator";

export const CANAUX_ENVOI_RESULTATS = ["mail", "whatsapp"] as const;
export const MODELES_ENVOI_RESULTATS = [
  "delf_dalf",
  "tef",
  "dfp",
  "postulant_prod",
] as const;

export class EnvoyerResultatsDto {
  @IsIn(CANAUX_ENVOI_RESULTATS) canal!: (typeof CANAUX_ENVOI_RESULTATS)[number];
  @IsIn(MODELES_ENVOI_RESULTATS) modele!: (typeof MODELES_ENVOI_RESULTATS)[number];
}
