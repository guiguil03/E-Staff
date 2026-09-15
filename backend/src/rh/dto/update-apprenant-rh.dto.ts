import { IsIn, IsOptional, IsString } from "class-validator";

export class UpdateApprenantRhDto {
  @IsOptional() @IsString() connecteurId?: string | null;
  @IsOptional() @IsString() sourceRecrutement?: string | null;
  @IsOptional() @IsString() groupeId?: string;

  @IsOptional() @IsIn(["formation", "essai", "actif", "inactif"]) statutAgent?: string;

  @IsOptional() @IsString() ribOuMobileMoney?: string | null;
  @IsOptional() @IsIn(["RIB", "MVola", "Orange Money", "Airtel Money"]) moyenPaiementType?:
    | string
    | null;
}
