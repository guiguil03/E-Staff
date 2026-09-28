import { IsNotEmpty, IsString, MinLength, MaxLength } from "class-validator";

export class ResetPasswordDto {
  @IsString() @IsNotEmpty() @MaxLength(256) token!: string;
  @IsString() @MinLength(8) @MaxLength(72) newPassword!: string;
}
