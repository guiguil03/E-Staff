import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCandidatDto {
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() phone!: string;

  // Agent d'acquisition sélectionné dans la liste déroulante à l'étape
  // "Coordonnées" du test — absent si le candidat n'a été recommandé par
  // personne (voir AgentAcquisition).
  @IsOptional() @IsString() agentAcquisitionId?: string;
}
