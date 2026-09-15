import { IsNotEmpty, IsString } from "class-validator";

export class CreateAgentAcquisitionDto {
  @IsString() @IsNotEmpty() nom!: string;
}
