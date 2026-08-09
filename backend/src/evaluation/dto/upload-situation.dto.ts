import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class UploadSituationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  situationIndex!: number;
}
