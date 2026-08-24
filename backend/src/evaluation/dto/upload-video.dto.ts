import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UploadVideoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  taskIndex!: number;

  // Sujet puis rôle choisis par le candidat quand la tâche propose plusieurs
  // sujets/options (voir VideoTask.subjects dans video-tasks.ts) — absents
  // pour les tâches sans choix.
  @IsOptional()
  @IsString()
  subjectKey?: string;

  @IsOptional()
  @IsString()
  optionKey?: string;
}
