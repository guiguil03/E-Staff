import { IsInt, IsISO8601, IsOptional, IsString, Min } from "class-validator";

export class UpsertSeanceDto {
  @IsOptional() @IsISO8601() startAt?: string;
  @IsOptional() @IsInt() @Min(15) dureeMinutes?: number;
  @IsOptional() @IsString() objectifs?: string;
}
