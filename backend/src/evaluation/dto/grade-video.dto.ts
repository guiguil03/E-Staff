import { IsObject } from "class-validator";

export class GradeVideoDto {
  // { [criteriaKey]: 0.5 | 1 | 1.5 | 2 } — voir VIDEO_GRADING_CRITERIA.
  // La validation stricte des échelons se fait dans EvaluationService.
  @IsObject() criteria!: Record<string, number>;
}
