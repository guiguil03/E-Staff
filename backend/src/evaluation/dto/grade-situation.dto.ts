import { IsObject } from "class-validator";

export class GradeSituationDto {
  // { [criteriaKey]: boolean } — voir SITUATION_GRADING_CRITERIA
  @IsObject() criteria!: Record<string, boolean>;
}
