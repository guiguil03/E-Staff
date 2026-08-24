import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UploadVideoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  taskIndex!: number;

  // Rôle choisi par le candidat quand la tâche propose des options (voir
  // VideoTask.options dans video-tasks.ts) — absent pour les tâches sans choix.
  @IsOptional()
  @IsString()
  optionKey?: string;
}
