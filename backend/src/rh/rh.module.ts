import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CockpitModule } from '../cockpit/cockpit.module';
import { NotationModule } from '../notation/notation.module';
import { EmailService } from '../common/email.service';
import { StorageService } from '../common/storage.service';
import { RhController } from './rh.controller';
import { RhService } from './rh.service';

@Module({
  imports: [PrismaModule, CockpitModule, NotationModule],
  controllers: [RhController],
  providers: [RhService, EmailService, StorageService],
})
export class RhModule {}
