import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateMediaPostDto {
  @IsOptional() @IsString() @MaxLength(500) caption?: string;
  @IsOptional() @IsString() @MaxLength(80) auteur?: string;
  @IsOptional() @IsBoolean() publiee?: boolean;
}
