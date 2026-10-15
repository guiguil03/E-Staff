import { IsIn } from "class-validator";

export const CONNECTEUR_STATUSES = ["nouveau", "contacte", "actif"] as const;

export class UpdateConnecteurStatusDto {
  @IsIn(CONNECTEUR_STATUSES) status!: (typeof CONNECTEUR_STATUSES)[number];
}
