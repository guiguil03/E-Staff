import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

// Saisie du jour par l'agent lui-même. La date n'est pas un champ : c'est
// toujours le jour courant (mis à jour automatiquement côté service).
export class SaisieJourneeDto {
  @IsNumber() @Min(0) @Max(24) heuresTravaillees!: number;
  @IsNumber() @Min(0) @Max(24) heuresPanne!: number;
  // Ventes / objectifs validés sur la journée — le pourcentage atteint en
  // est déduit (réalisé / objectif journalier de la mission).
  @IsInt() @Min(0) realise!: number;
  @IsOptional() @IsString() @MaxLength(1000) remarques?: string | null;
}
