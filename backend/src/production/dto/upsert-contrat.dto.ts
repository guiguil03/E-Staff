import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpsertContratDto {
  @IsString() @IsNotEmpty() clientNom!: string;
  @IsOptional() @IsString() entrepriseProjetId?: string;
  @IsOptional() @IsString() connecteurId?: string | null;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() dateSignature?: string | null;
  @IsString() dateDebut!: string; // ISO
  @IsOptional() @IsString() dateFin?: string | null;

  @IsOptional() @IsIn(["actif", "termine", "suspendu"]) statut?: string;

  @IsOptional() @IsNumber() tarifMensuel?: number | null;
}
