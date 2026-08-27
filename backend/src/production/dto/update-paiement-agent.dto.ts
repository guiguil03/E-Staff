import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdatePaiementAgentDto {
  @IsOptional() @IsNumber() montantBase?: number;
  @IsOptional() @IsNumber() montantPrime?: number;
  @IsOptional() @IsString() moyenPaiement?: string | null;
}
