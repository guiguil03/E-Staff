import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitPaymentReferenceDto {
  @IsString() @IsNotEmpty() reference!: string;
}
