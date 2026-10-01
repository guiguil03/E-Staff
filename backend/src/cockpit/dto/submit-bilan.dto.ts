import { IsString, MinLength } from "class-validator";

export class SubmitBilanDto {
  @IsString() @MinLength(1) constat!: string;
  @IsString() @MinLength(1) analyse!: string;
  @IsString() @MinLength(1) axes!: string;
}
