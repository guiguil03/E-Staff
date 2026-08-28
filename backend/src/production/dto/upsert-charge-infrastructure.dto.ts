import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpsertChargeInfrastructureDto {
  @IsString() @IsNotEmpty() poste!: string;
  @IsOptional() @IsString() motif?: string | null;
  @IsOptional() @IsString() prestataire?: string | null;
  @IsString() @IsNotEmpty() periode!: string; // "AAAA-MM"

  @IsNumber() montantTheorique!: number;
  @IsOptional() @IsNumber() montantReel?: number;

  @IsOptional()
  @IsIn(["Virement", "MVola", "Orange Money", "Airtel Money", "Espèces"])
  modePaiement?: string | null;
}
