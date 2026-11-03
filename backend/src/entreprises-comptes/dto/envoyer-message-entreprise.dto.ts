import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class EnvoyerMessageEntrepriseDto {
  @IsString() @IsNotEmpty() @MaxLength(2000) texte!: string;
  @IsOptional() @IsString() contratId?: string | null;
}
