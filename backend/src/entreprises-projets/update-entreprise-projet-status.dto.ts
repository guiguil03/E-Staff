import { IsIn } from "class-validator";

export const ENTREPRISE_PROJET_STATUSES = ["nouveau", "contacte", "qualifie", "converti"] as const;

export class UpdateEntrepriseProjetStatusDto {
  @IsIn(ENTREPRISE_PROJET_STATUSES) status!: (typeof ENTREPRISE_PROJET_STATUSES)[number];
}
