import { IsObject } from "class-validator";

export class GradePartieOuverteDto {
  // { [criteriaKey]: points (0 à maxPoints du critère, pas de 0.5) — voir
  // PARTIE_OUVERTE_GRADING_CRITERIA.
  @IsObject() criteria!: Record<string, number>;
}
