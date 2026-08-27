import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class UpsertSuiviAgentHebdoDto {
  @IsString() semaine!: string; // format ISO "AAAA-Wss"

  @IsOptional() @IsInt() concretisations?: number;
  @IsOptional() @IsNumber() tauxAbsence?: number | null;
  @IsOptional() @IsInt() nbRetards?: number;
  @IsOptional() @IsString() remarques?: string | null;
}
