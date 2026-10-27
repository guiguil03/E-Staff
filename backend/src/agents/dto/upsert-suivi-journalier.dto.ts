import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class UpsertSuiviJournalierDto {
  @IsString() jour!: string; // ISO — normalisé à minuit UTC côté service

  // Production du jour. Avec une cible sur la mission
  // (Mission.objectifJournalier), le taux d'atteinte en est déduit ; sinon
  // il faut fournir `tauxAtteint` directement.
  @IsOptional() @IsInt() realise?: number | null;
  @IsOptional() @IsNumber() tauxAtteint?: number;

  @IsOptional() @IsNumber() heuresTravaillees?: number;
  @IsOptional() @IsNumber() heuresPanne?: number;
  @IsOptional() @IsString() remarques?: string | null;
}
