import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMissionDto {
  @IsString() @IsNotEmpty() apprenantId!: string;
  @IsString() @IsNotEmpty() contratId!: string;
  @IsOptional() @IsString() superviseurId?: string;
  @IsString() @IsNotEmpty() role!: string;
  @IsString() dateDebut!: string; // ISO
}
