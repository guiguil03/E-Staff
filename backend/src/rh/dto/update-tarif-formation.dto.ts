import { IsNumber, Min } from "class-validator";

export class UpdateTarifFormationDto {
  @IsNumber() @Min(0) prixFormation!: number;
}
