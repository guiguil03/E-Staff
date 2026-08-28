import { IsNumber, IsOptional } from "class-validator";

export class UpdatePerformanceSuperviseurClientDto {
  @IsOptional() @IsNumber() tauxPerformance?: number | null;
  @IsOptional() @IsNumber() prime?: number;
}
