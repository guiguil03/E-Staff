import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertFormateurDto {
  @IsString() @IsNotEmpty() matricule!: string;
  @IsString() @IsNotEmpty() prenom!: string;
  @IsString() @IsNotEmpty() nom!: string;
  @IsEmail() email!: string;

  // Groupes à assigner en une seule fois à la création (voir
  // RhService.createFormateur) — évite l'aller-retour séparé par le menu
  // déroulant "Assigner un groupe" pour le cas courant (nouveau formateur
  // déjà su avec ses groupes). Ignoré par updateFormateur, qui garde
  // l'assignation groupe par groupe existante.
  @IsOptional() @IsArray() @IsString({ each: true }) groupeIds?: string[];
}
