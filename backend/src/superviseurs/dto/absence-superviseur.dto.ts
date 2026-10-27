import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class AbsenceSuperviseurDto {
  @IsString() jour!: string; // ISO
  @IsNumber() @Min(0.25) @Max(24) heures!: number;
  @IsBoolean() justifiee!: boolean;
  @IsOptional() @IsString() @MaxLength(300) motif?: string | null;
}
