import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateGroupeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]{1,4}$/, { message: "Clé de groupe invalide (ex. G, H2)." })
  cle!: string;

  @IsString() @IsNotEmpty() label!: string;
}
