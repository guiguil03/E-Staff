import { IsOptional, IsString, MaxLength } from "class-validator";

export class SignalerAssistanceDto {
  @IsOptional() @IsString() @MaxLength(300) message?: string | null;
}
