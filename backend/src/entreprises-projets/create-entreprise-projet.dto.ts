import { IsBoolean, IsEmail, IsNotEmpty, IsString, Equals } from "class-validator";

export class CreateEntrepriseProjetDto {
  // 1. Informations sur l'entreprise
  @IsString() @IsNotEmpty() companyName!: string;
  @IsString() @IsNotEmpty() taxId!: string;
  @IsString() @IsNotEmpty() sector!: string;
  @IsString() @IsNotEmpty() address!: string;
  @IsString() @IsNotEmpty() country!: string;

  // 2. Contact & décisionnaire
  @IsString() @IsNotEmpty() contactName!: string;
  @IsString() @IsNotEmpty() contactRole!: string;
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() phone!: string;

  // 3. Cahier des charges & attentes
  @IsString() @IsNotEmpty() serviceType!: string;
  @IsString() @IsNotEmpty() teamSize!: string;
  @IsString() @IsNotEmpty() startDate!: string;
  @IsString() @IsNotEmpty() needsDetails!: string;

  // 4. Consentement RGPD — doit être coché
  @IsBoolean()
  @Equals(true, { message: "Le consentement RGPD est obligatoire." })
  consent!: boolean;
}
