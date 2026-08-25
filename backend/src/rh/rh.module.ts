import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CockpitModule } from '../cockpit/cockpit.module';
import { RhController } from './rh.controller';
import { RhService } from './rh.service';

@Module({
  imports: [PrismaModule, CockpitModule],
  controllers: [RhController],
  providers: [RhService],
})
export class RhModule {}
