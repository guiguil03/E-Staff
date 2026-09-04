import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage.service';
import { CreateRegistrationDto } from './create-registration.dto';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  create(dto: CreateRegistrationDto) {
    return this.prisma.registration.create({ data: dto });
  }

  // CV facultatif, déposé au même moment que l'inscription — même principe
  // que EvaluationService.uploadCv (clé stable, écrasée en cas de redépôt).
  async uploadCv(id: string, file: Express.Multer.File) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
    });
    if (!registration) throw new NotFoundException('Inscription introuvable.');

    const key = `registrations/${id}/cv.pdf`;
    await this.storage.uploadBuffer(key, file.buffer, 'application/pdf');

    return this.prisma.registration.update({
      where: { id },
      data: { cvKey: key, cvUploadedAt: new Date() },
    });
  }
}
