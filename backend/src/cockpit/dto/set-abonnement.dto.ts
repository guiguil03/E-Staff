import { IsISO8601 } from "class-validator";

export class SetAbonnementDto {
  @IsISO8601()
  expireAt!: string;
}
