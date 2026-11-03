import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class EnvoyerMessageEntrepriseDto {
  @IsString() @IsNotEmpty() contratId!: string;
  @IsString() @IsNotEmpty() @MaxLength(2000) texte!: string;
}
