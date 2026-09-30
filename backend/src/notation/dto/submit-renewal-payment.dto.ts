import { IsIn, IsNotEmpty, IsString } from "class-validator";

// Multipart (reçu optionnel en fichier) — mêmes contraintes que
// SubmitPaymentPublicDto (registrations) : cguAccepted doit valoir
// exactement "true", pas de case cochée par défaut.
export class SubmitRenewalPaymentDto {
  @IsString() @IsNotEmpty() reference!: string;
  @IsIn(["true"]) cguAccepted!: string;
}
