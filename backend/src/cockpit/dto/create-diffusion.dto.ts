import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateDiffusionDto {
  @IsOptional() @IsString() groupeId?: string | null;
  // Renseigné = message privé à cet apprenant (groupeId est alors ignoré).
  @IsOptional() @IsString() apprenantMatricule?: string | null;
  @IsString() @MinLength(1) message!: string;
}
