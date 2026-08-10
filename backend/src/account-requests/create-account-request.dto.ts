import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateAccountRequestDto {
  @IsString() @IsNotEmpty() role!: string;
  @IsString() @IsNotEmpty() firstName!: string;
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() phone!: string;
}
