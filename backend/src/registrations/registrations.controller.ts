import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './create-registration.dto';
import { SubmitPaymentReferenceDto } from './submit-payment-reference.dto';
import { SendContractDto } from './send-contract.dto';
import { AdminGuard } from '../common/admin.guard';

const MAX_CV_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 Mo

@ApiTags('Inscriptions')
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly service: RegistrationsService) {}

  @Post()
  create(@Body() dto: CreateRegistrationDto) {
    return this.service.create(dto);
  }

  // ---- Portail RH (admin) — contrat + paiement ---------------------------

  @UseGuards(AdminGuard)
  @Get()
  list() {
    return this.service.list();
  }

  @UseGuards(AdminGuard)
  @Post(':id/send-contract')
  sendContract(@Param('id') id: string, @Body() dto: SendContractDto) {
    return this.service.sendContract(id, dto);
  }

  // Repli admin — au cas où l'inscrit transmet sa référence par téléphone
  // plutôt que via la page publique ci-dessous.
  @UseGuards(AdminGuard)
  @Post(':id/payment-reference')
  submitPaymentReference(@Param('id') id: string, @Body() dto: SubmitPaymentReferenceDto) {
    return this.service.submitPaymentReference(id, dto);
  }

  @UseGuards(AdminGuard)
  @Post(':id/confirm-payment')
  confirmPayment(@Param('id') id: string) {
    return this.service.confirmPayment(id);
  }

  // ---- Parcours inscrit (public) — contrat + paiement --------------------
  // Accessible uniquement via le lien envoyé par e-mail (id comme jeton),
  // même principe que /evaluation/contrat côté recrutement.

  @Get('contrats/:id')
  getContractInfo(@Param('id') id: string) {
    return this.service.getContractInfo(id);
  }

  @Get('contrats/:id/pdf')
  async streamContractPdf(@Param('id') id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getContractPdfStream(id);
    res.set('Content-Type', contentType ?? 'application/pdf');
    stream.pipe(res);
  }

  @Post('contrats/:id/paiement')
  submitPaymentReferencePublic(@Param('id') id: string, @Body() dto: SubmitPaymentReferenceDto) {
    return this.service.submitPaymentReferencePublic(id, dto);
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
