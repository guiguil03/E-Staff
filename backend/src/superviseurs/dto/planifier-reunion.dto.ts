import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class PlanifierReunionDto {
  @IsString() @IsNotEmpty() @MaxLength(120) titre!: string;
  @IsString() debut!: string; // ISO
  @IsInt() @Min(5) @Max(480) dureeMin!: number;
  // Agents invités (ids). Omis ou vide : toute l équipe (réunion collective).
  @IsOptional() @IsArray() @IsString({ each: true }) agentIds?: string[];
}
