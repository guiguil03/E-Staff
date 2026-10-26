import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateMissionDto {
  @IsOptional() @IsString() superviseurId?: string | null;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() dateFin?: string | null; // ISO — renseigner = clôturer la mission
  @IsOptional() @IsNumber() qualityScore?: number | null;
  @IsOptional() @IsNumber() tarifNegocie?: number | null;

  // Cibles chiffrées de l'agent sur cette mission (voir Mission) — null
  // efface la cible, undefined la laisse inchangée.
  @IsOptional() @IsInt() objectifJournalier?: number | null;
  @IsOptional() @IsInt() objectifHebdo?: number | null;
}
