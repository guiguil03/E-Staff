import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class ConfirmPaymentDto {
  @IsString() @IsNotEmpty() groupeId!: string;

  // Montant réellement encaissé — sert à journaliser l'encaissement
  // (RhService.listEncaissements) sans que la RH ait à le ressaisir à la
  // main dans Facturation (voir EvaluationService.confirmPayment).
  @IsNumber() montant!: number;
  @IsOptional() @IsString() moyenPaiement?: string;
}
