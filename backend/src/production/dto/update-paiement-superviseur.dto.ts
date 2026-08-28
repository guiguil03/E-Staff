import { IsNumber } from "class-validator";

export class UpdatePaiementSuperviseurDto {
  @IsNumber() montantFixe!: number;
}
