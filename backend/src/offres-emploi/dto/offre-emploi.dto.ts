import {
  IsArray,
  IsBoolean,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";

export class CreateOffreEmploiDto {
  @IsString() @IsNotEmpty() metierSlug!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) titre!: string;
  @IsOptional() @IsString() @MaxLength(16) drapeau?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) modalites?: string[];
  @IsOptional() @IsString() @MaxLength(2000) projet?: string;
  @IsOptional() @IsString() @MaxLength(1000) remuneration?: string;
  @IsOptional() @IsString() @MaxLength(2000) prerequis?: string;
  @IsInt() @Min(1) @Max(10000) placesTotal!: number;
  @IsOptional() @IsInt() @Min(0) placesPourvues?: number;
  // null = pas de date limite.
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsISO8601() dateLimite?: string | null;
  @IsOptional() @IsBoolean() cloturee?: boolean;
  @IsOptional() @IsBoolean() publiee?: boolean;
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== "")
  @IsUrl({ require_protocol: true })
  lienWhatsapp?: string | null;
}

// Mise à jour partielle — mêmes règles, tous les champs facultatifs.
export class UpdateOffreEmploiDto {
  @IsOptional() @IsString() @IsNotEmpty() metierSlug?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) titre?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(16) drapeau?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) modalites?: string[];
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(2000) projet?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(1000) remuneration?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(2000) prerequis?: string | null;
  @IsOptional() @IsInt() @Min(1) @Max(10000) placesTotal?: number;
  @IsOptional() @IsInt() @Min(0) placesPourvues?: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsISO8601() dateLimite?: string | null;
  @IsOptional() @IsBoolean() cloturee?: boolean;
  @IsOptional() @IsBoolean() publiee?: boolean;
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== "")
  @IsUrl({ require_protocol: true })
  lienWhatsapp?: string | null;
}
