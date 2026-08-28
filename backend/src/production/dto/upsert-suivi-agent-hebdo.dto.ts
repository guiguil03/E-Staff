import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class UpsertSuiviAgentHebdoDto {
  @IsString() semaine!: string; // format ISO "AAAA-Wss"

  @IsOptional() @IsInt() concretisations?: number;
  @IsOptional() @IsNumber() tauxAbsence?: number | null;
  @IsOptional() @IsInt() nbRetards?: number;
  @IsOptional() @IsString() remarques?: string | null;

  // Pointage — saisie manuelle par le superviseur.
  @IsOptional() @IsNumber() heuresRetardCumulees?: number;
  @IsOptional() @IsNumber() heuresAbsenceNonJustifiee?: number;
  @IsOptional() @IsNumber() heuresSupValidees?: number;

  // Métriques de production / télévente — saisie manuelle.
  @IsOptional() @IsNumber() caRealise?: number;
  @IsOptional() @IsInt() nbVentes?: number;
  @IsOptional() @IsInt() rdvValides?: number;
}
