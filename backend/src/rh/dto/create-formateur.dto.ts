import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateFormateurDto {
  @IsString() @IsNotEmpty() prenom!: string;
  @IsString() @IsNotEmpty() nom!: string;
  @IsEmail() email!: string;
}
