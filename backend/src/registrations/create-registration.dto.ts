import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRegistrationDto {
  @IsString() @IsNotEmpty() segment!: string;
  @IsString() @IsNotEmpty() firstName!: string;
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() phone!: string;

  // Envoyé uniquement par le funnel Examens (obligatoire côté UI là-bas,
  // voir DiplomaCard.tsx) — optionnel ici pour ne pas casser les autres
  // funnels (FOL, entreprises, Studio Métier) qui ne l'envoient pas.
  @IsOptional() @IsString() typeFormation?: string;
}
