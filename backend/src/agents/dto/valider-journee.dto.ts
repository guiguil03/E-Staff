import { IsOptional, IsString, MaxLength } from "class-validator";

export class ValiderJourneeDto {
  // Motif / note du superviseur (ex. "Panne fibre validée").
  @IsOptional() @IsString() @MaxLength(500) commentaire?: string | null;
}
