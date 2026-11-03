import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

// `ref` est la référence opaque renvoyée par GET .../vivier (ex.
// "agent:<id>" ou "apprenant:<id>") — jamais un nom ou un matricule, voir
// EntreprisesComptesService.listerVivier. `type` est redondant avec le
// préfixe de `ref` mais explicite côté validation.
export class ExprimerInteretDto {
  @IsString() @IsNotEmpty() ref!: string;
  @IsIn(["agent", "apprenant"]) type!: "agent" | "apprenant";
  @IsOptional() @IsString() contratId?: string;
  @IsOptional() @IsString() @MaxLength(120) posteSouhaite?: string;
  @IsOptional() @IsString() @MaxLength(1000) message?: string;
}
