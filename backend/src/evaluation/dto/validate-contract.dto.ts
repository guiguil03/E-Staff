import { IsNotEmpty, IsString } from "class-validator";

export class ValidateContractDto {
  @IsString() @IsNotEmpty() duree!: string;
  @IsString() @IsNotEmpty() frais!: string;
  @IsString() @IsNotEmpty() conditions!: string;
}
