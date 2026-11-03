import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpsertStandForumDto {
  @IsString() @IsNotEmpty() @MaxLength(120) nom!: string;
  @IsOptional() @IsString() @MaxLength(4000) presentation?: string;
  @IsOptional() @IsString() @MaxLength(4000) offresTexte?: string;
  // JSON string [{ startAt, dureeMinutes }] — saisi côté front, transmis tel
  // quel (même convention que Connecteur.soughtRoles).
  @IsOptional() @IsString() creneauxEntretien?: string;
  @IsOptional() @IsBoolean() publie?: boolean;
}
