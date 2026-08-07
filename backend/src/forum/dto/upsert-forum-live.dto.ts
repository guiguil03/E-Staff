import { IsInt, IsISO8601, IsOptional, IsString, Min } from "class-validator";

export class UpsertForumLiveDto {
  @IsOptional() @IsString() titre?: string;
  @IsOptional() @IsString() invite?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsISO8601() startAt?: string;
  @IsOptional() @IsInt() @Min(15) dureeMinutes?: number;
}
