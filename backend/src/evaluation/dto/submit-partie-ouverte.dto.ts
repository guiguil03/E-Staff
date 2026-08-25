import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from "class-validator";

export class SubmitPartieOuverteDto {
  @IsString() reformulationText!: string;

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  plurielTexts!: string[];

  @IsString() styleText!: string;
  @IsString() synonymeText!: string;
  @IsString() redactionText!: string;
}
