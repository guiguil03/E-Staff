import { IsEmail } from "class-validator";

export class LierCandidatDto {
  @IsEmail() email!: string;
}
