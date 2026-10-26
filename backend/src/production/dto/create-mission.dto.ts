import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateMissionDto {
  // Titulaire de la mission : un Agent de production (cas normal) ou un
  // Apprenant (montage historique, avant le compte Agent du 2026-10-22).
  // Exactement l'un des deux — vérifié dans ProductionService.createMission.
  @IsOptional() @IsString() @IsNotEmpty() agentId?: string;
  @IsOptional() @IsString() @IsNotEmpty() apprenantId?: string;

  @IsString() @IsNotEmpty() contratId!: string;
  @IsOptional() @IsString() superviseurId?: string;
  @IsString() @IsNotEmpty() role!: string;
  @IsString() dateDebut!: string; // ISO
  @IsOptional() @IsNumber() tarifNegocie?: number;

  // Cibles chiffrées de l'agent sur cette mission (voir Mission).
  @IsOptional() @IsInt() objectifJournalier?: number;
  @IsOptional() @IsInt() objectifHebdo?: number;
}
