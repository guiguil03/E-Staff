import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsString() @IsNotEmpty() matricule!: string;
  @IsString() @IsNotEmpty() oldPassword!: string;
  @IsString() @MinLength(8) newPassword!: string;
}
