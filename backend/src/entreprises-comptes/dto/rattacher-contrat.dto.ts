import { IsNotEmpty, IsString } from "class-validator";

export class RattacherContratDto {
  @IsString() @IsNotEmpty() contratId!: string;
}
