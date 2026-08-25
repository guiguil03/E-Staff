import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpsertReunionDto {
  @IsString() titre!: string;
  @IsOptional() @IsString() description?: string;

  @IsIn(['equipe', 'partenaires', 'tous'])
  audience!: 'equipe' | 'partenaires' | 'tous';

  @IsArray() @IsString({ each: true }) participants!: string[];

  @IsString() startAt!: string; // ISO

  @IsOptional() @IsInt() @Min(15) dureeMinutes?: number;
  @IsOptional() @IsString() lieu?: string;
}
