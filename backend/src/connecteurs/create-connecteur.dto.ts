import { ArrayNotEmpty, IsArray, IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateConnecteurDto {
  // Étape 1 — coordonnées
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() phone!: string;

  // Étape 3 — questionnaire de pré-qualification
  @IsString() @IsNotEmpty() activityType!: string;
  @IsString() @IsNotEmpty() clientCount!: string;
  @IsArray() @ArrayNotEmpty() soughtRoles!: string[];
  @IsString() @IsNotEmpty() cvVolume!: string;
  @IsString() @IsNotEmpty() budgetPerAgent!: string;
  @IsString() @IsNotEmpty() presentationMode!: string;
  @IsString() @IsNotEmpty() paymentChannel!: string;
  @IsString() @IsNotEmpty() opportunityTiming!: string;
}
