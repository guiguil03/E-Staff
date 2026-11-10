import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

// Affectation RH en lot : après un entretien validé, la RH coche les profils
// retenus et renseigne UNE fois contrat / superviseur / rôle / date de début,
// au lieu de traiter chaque intérêt un par un (voir
// EntreprisesComptesService.affecterLot — une Mission est créée par profil).
export class AffecterLotDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @IsString({ each: true }) interetIds!: string[];

  @IsString() @IsNotEmpty() contratId!: string;
  @IsOptional() @IsString() superviseurId?: string;
  @IsString() @IsNotEmpty() role!: string;
  @IsString() @IsNotEmpty() dateDebut!: string; // ISO
  @IsOptional() @IsNumber() tarifNegocie?: number;
  @IsOptional() @IsInt() objectifJournalier?: number;
  @IsOptional() @IsInt() objectifHebdo?: number;
}
