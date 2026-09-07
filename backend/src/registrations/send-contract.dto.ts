import { IsNotEmpty, IsString } from 'class-validator';

export class SendContractDto {
  @IsString() @IsNotEmpty() duree!: string;
  @IsString() @IsNotEmpty() frais!: string;
  @IsString() @IsNotEmpty() conditions!: string;
}
