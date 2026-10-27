import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

// Retour du client sur l'agent, relayé par la RH.
export class NoteClientDto {
  @IsString() date!: string; // ISO
  @IsNumber() @Min(0) @Max(5) note!: number;
  @IsOptional() @IsString() @MaxLength(1000) remarque?: string | null;
}
