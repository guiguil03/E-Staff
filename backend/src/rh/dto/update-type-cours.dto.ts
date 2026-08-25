import { IsOptional, IsString } from "class-validator";

export class UpdateTypeCoursDto {
  @IsOptional() @IsString() typeCours?: string | null;
}
