import { IsNumber } from "class-validator";

export class UpdateEncaissementDto {
  @IsNumber() montant!: number;
}
