import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateMissionDto {
  @IsOptional() @IsString() superviseurId?: string | null;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() dateFin?: string | null; // ISO — renseigner = clôturer la mission
  @IsOptional() @IsNumber() qualityScore?: number | null;
  @IsOptional() @IsNumber() tarifNegocie?: number | null;
}
