import { IsObject } from "class-validator";

export class SubmitAnswersDto {
  @IsObject() lexiqueAnswers!: Record<string, string>;
  @IsObject() oralAnswers!: Record<string, string>;
}
