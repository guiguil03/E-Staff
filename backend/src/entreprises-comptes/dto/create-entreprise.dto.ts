import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateEntrepriseDto {
  @IsString() @IsNotEmpty() raisonSociale!: string;
  @IsString() @IsNotEmpty() contactNom!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() telephone?: string;
}
