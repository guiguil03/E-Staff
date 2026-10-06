import { Type } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";

export const PARCOURS = ["admission", "recrutement"] as const;
export type Parcours = (typeof PARCOURS)[number];

export const POSTES_VISES = [
  "teleoperateur",
  "televente",
  "teleprospecteur",
  "sdr",
  "fundraising",
  "autre",
] as const;

export class CreateCandidatDto {
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() phone!: string;

  // Agent d'acquisition sélectionné dans la liste déroulante à l'étape
  // "Coordonnées" du test — absent si le candidat n'a été recommandé par
  // personne (voir AgentAcquisition).
  @IsOptional() @IsString() agentAcquisitionId?: string;

  // Absent = "admission" (test d'entrée en formation, comportement historique).
  @IsOptional() @IsIn(PARCOURS) parcours?: Parcours;

  // Fiche candidat du parcours "recrutement" — obligatoire dans ce parcours
  // seulement, ignorée (non enregistrée) pour l'admission.
  @ValidateIf((o: CreateCandidatDto) => o.parcours === "recrutement")
  @IsIn(POSTES_VISES)
  posteVise?: (typeof POSTES_VISES)[number];

  @ValidateIf((o: CreateCandidatDto) => o.parcours === "recrutement" && o.posteVise === "autre")
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  posteAutre?: string;

  @ValidateIf((o: CreateCandidatDto) => o.parcours === "recrutement")
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  experienceAnnees?: number;

  @ValidateIf((o: CreateCandidatDto) => o.parcours === "recrutement")
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  experienceSecteurs?: string;

  @ValidateIf((o: CreateCandidatDto) => o.parcours === "recrutement")
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  parcoursPoste?: string;

  @ValidateIf((o: CreateCandidatDto) => o.parcours === "recrutement")
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(500)
  tauxObjectifs?: number;
}
