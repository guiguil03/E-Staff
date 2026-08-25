import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpsertFormateurDto {
  @IsString() @IsNotEmpty() matricule!: string;
  @IsString() @IsNotEmpty() prenom!: string;
  @IsString() @IsNotEmpty() nom!: string;
  @IsEmail() email!: string;
}
