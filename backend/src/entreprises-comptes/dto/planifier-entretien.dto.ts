import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class PlanifierEntretienDto {
  @IsOptional() @IsString() interetVivierId?: string;
  @IsString() @IsNotEmpty() @MaxLength(160) titre!: string;
  @IsOptional() @IsString() startAt?: string; // ISO
  @IsOptional() @IsInt() @Min(10) @Max(240) dureeMinutes?: number;
  // Requis uniquement quand interetVivierId n'est pas fourni (entretien
  // libre, candidat hors vivier) — sinon l'e-mail est résolu côté serveur
  // depuis le profil réel (voir EntreprisesComptesService.planifierEntretien).
  @IsOptional() @IsEmail() emailCandidat?: string;
}
