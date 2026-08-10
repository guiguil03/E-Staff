import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class UploadVideoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  taskIndex!: number;
}
