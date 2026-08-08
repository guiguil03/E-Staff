import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Equals } from "class-validator";

export class CreateEntrepriseFormationDto {
  @IsString() @IsNotEmpty() companyName!: string;
  @IsString() @IsNotEmpty() contactName!: string;
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() phone!: string;

  @IsString() secteur!: string;
  @IsString() @IsNotEmpty() effectif!: string;
  @IsString() @IsNotEmpty() motif!: string;
  @IsOptional() @IsString() message?: string;

  @IsBoolean()
  @Equals(true, { message: "Le consentement RGPD est obligatoire." })
  consent!: boolean;
}
