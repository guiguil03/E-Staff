import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateMissionDto {
  @IsString() @IsNotEmpty() apprenantId!: string;
  @IsString() @IsNotEmpty() contratId!: string;
  @IsOptional() @IsString() superviseurId?: string;
  @IsString() @IsNotEmpty() role!: string;
  @IsString() dateDebut!: string; // ISO
  @IsOptional() @IsNumber() tarifNegocie?: number;
}
