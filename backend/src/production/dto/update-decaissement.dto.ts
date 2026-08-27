import { IsNumber } from "class-validator";

export class UpdateDecaissementDto {
  @IsNumber() montantReel!: number;
}
