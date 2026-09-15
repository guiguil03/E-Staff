import { IsNotEmpty, IsString } from "class-validator";

export class ConsumeViewAsTokenDto {
  @IsString() @IsNotEmpty() token!: string;
}
