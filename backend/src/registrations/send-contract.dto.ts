import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class SendContractDto {
  @IsString() @IsNotEmpty() duree!: string;
  @IsString() @IsNotEmpty() frais!: string;
  @IsString() @IsNotEmpty() conditions!: string;

  // Montant exact à encaisser (Ariary) — optionnel, active le paiement en
  // ligne Papi sur la page contrat si renseigné (voir schema.prisma).
  @IsInt() @Min(300) @IsOptional() montant?: number;
}
