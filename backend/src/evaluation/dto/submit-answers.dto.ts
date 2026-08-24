import { IsObject, IsOptional } from "class-validator";

// Les deux champs sont optionnels et indépendants — le candidat peut
// soumettre le Bloc 1 (lexique) et le Bloc 4 (oral) dans l'ordre de son
// choix, chacun via son propre appel à cet endpoint (voir
// EvaluationService.submitAnswers, qui accepte un seul des deux à la fois).
export class SubmitAnswersDto {
  @IsOptional() @IsObject() lexiqueAnswers?: Record<string, string>;
  @IsOptional() @IsObject() oralAnswers?: Record<string, string>;
}
