import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateDiffusionDto {
  @IsOptional() @IsString() groupeId?: string | null;
  @IsString() @MinLength(1) message!: string;
}
