import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './create-registration.dto';

const MAX_CV_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 Mo

@ApiTags('Inscriptions')
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly service: RegistrationsService) {}

  @Post()
  create(@Body() dto: CreateRegistrationDto) {
    return this.service.create(dto);
  }

  @Post(':id/cv')
  @UseInterceptors(
    FileInterceptor('cv', {
      limits: { fileSize: MAX_CV_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, file.mimetype === 'application/pdf');
      },
    }),
  )
  uploadCv(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'Fichier CV manquant, trop volumineux (10 Mo max) ou pas au format PDF.',
      );
    }
    return this.service.uploadCv(id, file);
  }
}
