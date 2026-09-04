import { Module } from '@nestjs/common';
import { StorageService } from '../common/storage.service';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';

@Module({
  controllers: [RegistrationsController],
  providers: [RegistrationsService, StorageService],
})
export class RegistrationsModule {}
