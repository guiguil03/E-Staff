import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateFactureDto {
  @IsString() @IsNotEmpty() contratId!: string;
  @IsString() @IsNotEmpty() periode!: string; // "2026-09"
  @IsNumber() montant!: number;
}
