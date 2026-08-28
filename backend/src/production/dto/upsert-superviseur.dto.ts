import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpsertSuperviseurDto {
  @IsString() @IsNotEmpty() matricule!: string;
  @IsString() @IsNotEmpty() prenom!: string;
  @IsString() @IsNotEmpty() nom!: string;
  @IsEmail() email!: string;

  @IsOptional() @IsNumber() tarifFixe?: number | null;
  @IsOptional() @IsString() ribOuMobileMoney?: string | null;
  @IsOptional() @IsIn(["RIB", "MVola", "Orange Money", "Airtel Money"]) moyenPaiementType?:
    | string
    | null;
}
