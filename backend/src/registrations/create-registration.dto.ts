import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRegistrationDto {
  @IsString() @IsNotEmpty() segment!: string;
  @IsString() @IsNotEmpty() firstName!: string;
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() phone!: string;

  // Envoyé uniquement par le funnel Examens (obligatoire côté UI là-bas,
  // voir DiplomaCard.tsx) — optionnel ici pour ne pas casser les autres
  // funnels (FOL, entreprises, Studio Métier) qui ne l'envoient pas.
  @IsOptional() @IsString() typeFormation?: string;

  // Studio Métier uniquement : offre d'emploi précise choisie sur la vitrine
  // (voir OffreEmploi), et candidature déposée en liste d'attente sur une
  // offre clôturée.
  @IsOptional() @IsString() offreEmploiId?: string;
  @IsOptional() @IsBoolean() listeAttente?: boolean;
}
