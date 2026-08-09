import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateCandidatDto {
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() phone!: string;
}
