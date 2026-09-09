import { IsIn, IsNotEmpty, IsString } from 'class-validator';

// Soumission publique (page /inscription/contrat/[id]) — multipart (reçu
// optionnel en fichier), donc les champs arrivent en string même pour le
// booléen. cguAccepted doit valoir exactement "true" : pas de case à
// cocher acceptée non cochée, voir Article 1 des CGU (0% remboursement).
export class SubmitPaymentPublicDto {
  @IsString() @IsNotEmpty() reference!: string;
  @IsIn(['true']) cguAccepted!: string;
}
