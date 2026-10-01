import { IsNotEmpty, IsString, MinLength, MaxLength } from "class-validator";

export class ChangePasswordDto {
  @IsString() @IsNotEmpty() @MaxLength(64) matricule!: string;
  @IsString() @IsNotEmpty() @MaxLength(128) oldPassword!: string;
  @IsString() @MinLength(8) @MaxLength(72) newPassword!: string;
}
