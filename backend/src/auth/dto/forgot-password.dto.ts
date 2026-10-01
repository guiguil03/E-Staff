import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ForgotPasswordDto {
  @IsString() @IsNotEmpty() @MaxLength(64) matricule!: string;
}
