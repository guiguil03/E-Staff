import { IsOptional, IsString } from "class-validator";

export class UpsertRapportHebdoDto {
  @IsString() semaine!: string; // format ISO "AAAA-Wss"

  @IsOptional() @IsString() superviseurId?: string | null;
  @IsOptional() @IsString() constat?: string | null;
  @IsOptional() @IsString() analyse?: string | null;
  @IsOptional() @IsString() axesAmelioration?: string | null;
}
