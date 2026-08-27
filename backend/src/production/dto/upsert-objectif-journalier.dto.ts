import { IsNumber, IsString } from "class-validator";

export class UpsertObjectifJournalierDto {
  @IsString() jour!: string; // ISO date
  @IsNumber() tauxAtteint!: number; // % de l'objectif journalier atteint
}
