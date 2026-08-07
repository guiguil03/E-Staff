import { IsInt, IsISO8601, IsOptional, IsString, Max, Min } from "class-validator";

export class UpsertSeanceDto {
  @IsOptional() @IsISO8601() startAt?: string;
  // Plafond à 4h (240 min) — garde-fou contre une saisie fautive (ex. 900
  // au lieu de 90) qui fausserait la fenêtre de rejoin et la détection de
  // chevauchement entre séances.
  @IsOptional() @IsInt() @Min(15) @Max(240) dureeMinutes?: number;
  @IsOptional() @IsString() objectifs?: string;
}
