import { IsString, MinLength } from "class-validator";

export class SubmitEssayDto {
  @IsString() subjectKey!: string;
  @IsString() @MinLength(1) text!: string;
}
