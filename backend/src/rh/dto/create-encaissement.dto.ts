import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateEncaissementDto {
  @IsString() @IsNotEmpty() apprenantId!: string;
  @IsNumber() montant!: number;
  @IsString() @IsNotEmpty() jour!: string; // "AAAA-MM-JJ"
  @IsOptional() @IsString() moyenPaiement?: string;
}
