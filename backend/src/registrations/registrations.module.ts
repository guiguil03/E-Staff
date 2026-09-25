import { Module } from '@nestjs/common';
import { StorageService } from '../common/storage.service';
import { EmailService } from '../common/email.service';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { PapiService } from './papi.service';
import { OffresEmploiModule } from '../offres-emploi/offres-emploi.module';

@Module({
  imports: [OffresEmploiModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService, StorageService, EmailService, PapiService],
})
export class RegistrationsModule {}
