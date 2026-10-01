import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ConsumeViewAsTokenDto {
  @IsString() @IsNotEmpty() @MaxLength(256) token!: string;
}
