import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpsertEntrepriseLiveDto {
  @IsString() @IsNotEmpty() @MaxLength(160) titre!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() startAt?: string; // ISO
  @IsOptional() @IsInt() @Min(10) @Max(240) dureeMinutes?: number;
}
