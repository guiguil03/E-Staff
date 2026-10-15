import { IsBoolean, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min } from "class-validator";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class CreateLotDto {
  @IsString() @IsNotEmpty() @MaxLength(160) nom!: string;
  @IsString() @IsNotEmpty() @MaxLength(1000) mission!: string;
  @IsISO8601() dateFinFormation!: string;
  @IsOptional() @IsString() @Matches(SLUG) @MaxLength(80) segment?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80) statutLabel?: string;
  @IsOptional() @IsBoolean() publie?: boolean;
}

export class UpdateLotDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) nom?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(1000) mission?: string;
  @IsOptional() @IsISO8601() dateFinFormation?: string;
  @IsOptional() @IsString() @Matches(SLUG) @MaxLength(80) segment?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80) statutLabel?: string;
  @IsOptional() @IsInt() @Min(0) ordre?: number;
  @IsOptional() @IsBoolean() publie?: boolean;
}

export class CreateMissionDto {
  @IsString() @IsNotEmpty() @MaxLength(160) titre!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) sousTitre!: string;
  @IsString() @IsNotEmpty() @MaxLength(1000) description!: string;
  @IsOptional() @IsBoolean() disponible?: boolean;
  @IsString() @IsNotEmpty() @MaxLength(200) detailStatut!: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80) ctaLabel?: string;
  @IsOptional() @IsString() @Matches(SLUG) @MaxLength(80) segment?: string;
  @IsOptional() @IsBoolean() publie?: boolean;
}

export class UpdateMissionDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) titre?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) sousTitre?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(1000) description?: string;
  @IsOptional() @IsBoolean() disponible?: boolean;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) detailStatut?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80) ctaLabel?: string;
  @IsOptional() @IsString() @Matches(SLUG) @MaxLength(80) segment?: string;
  @IsOptional() @IsInt() @Min(0) ordre?: number;
  @IsOptional() @IsBoolean() publie?: boolean;
}
