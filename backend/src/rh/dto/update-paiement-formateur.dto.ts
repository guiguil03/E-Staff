import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdatePaiementFormateurDto {
  @IsOptional() @IsNumber() montantBase?: number;
  @IsOptional() @IsNumber() montantPrime?: number;
  @IsOptional() @IsNumber() retenue?: number;
  @IsOptional() @IsString() moyenPaiement?: string | null;
}
