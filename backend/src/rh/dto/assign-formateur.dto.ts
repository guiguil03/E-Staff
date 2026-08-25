import { IsOptional, IsString } from 'class-validator';

export class AssignFormateurDto {
  // null/absent = désassigner le groupe (aucun formateur).
  @IsOptional() @IsString() formateurId?: string | null;
}
