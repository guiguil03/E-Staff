import { IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class GradeNotationDto {
  @IsOptional() @IsObject() gridData?: Record<string, unknown>;
  @IsOptional() @IsNumber() note?: number;
  @IsOptional() @IsString() commentaires?: string;
  @IsOptional() @IsNumber() scoreOn20?: number;
}
