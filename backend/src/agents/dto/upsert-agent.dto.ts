import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

// Statuts RH d'un agent — "inactif" coupe l'accès au compte sans supprimer
// l'historique (voir Agent.statut, AuthService.loginAgent).
export const STATUTS_AGENT = ["essai", "actif", "inactif"] as const;

export class UpsertAgentDto {
  @IsString() @IsNotEmpty() prenom!: string;
  @IsString() @IsNotEmpty() nom!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() telephone?: string | null;

  @IsOptional() @IsIn(STATUTS_AGENT) statut?: (typeof STATUTS_AGENT)[number];
  @IsOptional() @IsString() poste?: string | null;
  @IsOptional() @IsString() dateEmbauche?: string | null; // ISO
  @IsOptional() @IsNumber() salaireBase?: number | null;

  // Coordonnées de paiement — toute modification repasse par une
  // vérification RH (voir AgentsService.updateAgent).
  @IsOptional() @IsString() ribOuMobileMoney?: string | null;
  @IsOptional() @IsString() moyenPaiementType?: string | null;
}
