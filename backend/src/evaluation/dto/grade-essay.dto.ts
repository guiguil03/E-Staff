import { IsObject } from "class-validator";

export class GradeEssayDto {
  // { [criteriaKey]: 1.25 | 2.5 | 3.75 | 5 } — voir ESSAY_GRADING_CRITERIA.
  @IsObject() criteria!: Record<string, number>;
}
