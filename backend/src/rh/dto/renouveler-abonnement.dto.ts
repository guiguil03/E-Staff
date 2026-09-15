import { IsNotEmpty, IsString } from "class-validator";

export class RenouvelerAbonnementDto {
  @IsString() @IsNotEmpty() nouvelleEcheance!: string; // "AAAA-MM-JJ"
}
