import { IsObject } from "class-validator";

export class GradeSituationDto {
  // { [criteriaKey]: 0.25 | 0.5 | 0.75 | 1 } — voir SITUATION_GRADING_CRITERIA.
  // La validation stricte des échelons se fait dans EvaluationService
  // (message d'erreur plus parlant qu'un rejet générique de DTO).
  @IsObject() criteria!: Record<string, number>;
}
