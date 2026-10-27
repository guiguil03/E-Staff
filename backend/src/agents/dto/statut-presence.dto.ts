import { IsIn } from "class-validator";
import { STATUTS_PRESENCE } from "../../common/suivi-agent";

export class StatutPresenceDto {
  @IsIn(STATUTS_PRESENCE as unknown as string[]) statut!: string;
}
