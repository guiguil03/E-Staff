import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

// Traitement RH d'un InteretVivier. `affecte` déclenche la création d'une
// Mission réelle (ProductionService.createMission) — role/contratId/
// dateDebut sont alors requis ; `propose`/`refuse` ne font que changer le
// statut, affiché à l'entreprise.
export class TraiterInteretDto {
  @IsIn(["vu", "propose", "affecte", "refuse"]) statut!: "vu" | "propose" | "affecte" | "refuse";

  @IsOptional() @IsString() contratId?: string;
  @IsOptional() @IsString() superviseurId?: string;
  @IsOptional() @IsString() @IsNotEmpty() role?: string;
  @IsOptional() @IsString() dateDebut?: string; // ISO
  @IsOptional() @IsNumber() tarifNegocie?: number;
  @IsOptional() @IsInt() objectifJournalier?: number;
  @IsOptional() @IsInt() objectifHebdo?: number;
}
