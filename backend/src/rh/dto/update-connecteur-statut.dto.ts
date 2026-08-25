import { IsIn } from 'class-validator';

export class UpdateConnecteurStatutDto {
  @IsIn(['nouveau', 'contacte', 'actif'])
  status!: 'nouveau' | 'contacte' | 'actif';
}
