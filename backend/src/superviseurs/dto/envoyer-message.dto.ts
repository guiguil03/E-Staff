import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

// Consigne / annonce du superviseur. Sans agentId : diffusion à toute son équipe.
export class EnvoyerMessageDto {
  @IsString() @IsNotEmpty() @MaxLength(1000) texte!: string;
  @IsOptional() @IsString() agentId?: string | null;
}
