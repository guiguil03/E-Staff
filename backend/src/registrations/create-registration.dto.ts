import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateRegistrationDto {
  @IsString() @IsNotEmpty() segment!: string;
  @IsString() @IsNotEmpty() firstName!: string;
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() phone!: string;
}
