import { IsOptional, IsString } from "class-validator";

export class UpdateVagueDatesDto {
  @IsOptional() @IsString() dateDebut?: string | null; // ISO
  @IsOptional() @IsString() dateFin?: string | null; // ISO
}
