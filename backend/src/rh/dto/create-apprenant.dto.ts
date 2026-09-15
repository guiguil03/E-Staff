import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateApprenantDto {
  @IsString() @IsNotEmpty() prenom!: string;
  @IsString() @IsNotEmpty() nom!: string;
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() groupeId!: string;
}
