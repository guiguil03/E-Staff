import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @IsString() @IsNotEmpty() matricule!: string;
  @IsString() @IsNotEmpty() password!: string;
}
