import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateCompteStaffDto {
  @IsIn(["admin", "rh"]) role!: "admin" | "rh";
  @IsString() @IsNotEmpty() @MaxLength(80) prenom!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) nom!: string;
  @IsEmail() @MaxLength(200) email!: string;
}

export class SetActifDto {
  @IsBoolean() actif!: boolean;
}
