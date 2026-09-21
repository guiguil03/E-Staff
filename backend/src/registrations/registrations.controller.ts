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
import { SubmitPaymentPublicDto } from './submit-payment-public.dto';
import { SendContractDto } from './send-contract.dto';
import { PapiWebhookDto } from './papi-webhook.dto';
import { RhGuard } from '../common/rh.guard';
import { RateLimitGuard } from '../common/rate-limit.guard';

const MAX_CV_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 Mo
const MAX_RECEIPT_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 Mo
const RECEIPT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

@ApiTags('Inscriptions')
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly service: RegistrationsService) {}

  @UseGuards(RateLimitGuard('registrations-create', 5))
  @Post()
  create(@Body() dto: CreateRegistrationDto) {
    return this.service.create(dto);
  }

  // ---- Portail RH — contrat + paiement (RH depuis 2026-09-18) ------------

  @UseGuards(RhGuard)
  @Get()
  list() {
    return this.service.list();
  }

  @UseGuards(RhGuard)
  @Post(':id/send-contract')
  sendContract(@Param('id') id: string, @Body() dto: SendContractDto) {
    return this.service.sendContract(id, dto);
  }

  // Repli RH — au cas où l'inscrit transmet sa référence par téléphone
  // plutôt que via la page publique ci-dessous.
  @UseGuards(RhGuard)
  @Post(':id/payment-reference')
  submitPaymentReference(@Param('id') id: string, @Body() dto: SubmitPaymentReferenceDto) {
    return this.service.submitPaymentReference(id, dto);
  }

  @UseGuards(RhGuard)
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

  // Consultation du reçu par l'admin (lien affiché dans InscriptionsPanel).
  @Get('contrats/:id/recu')
  async streamPaymentReceipt(@Param('id') id: string, @Res() res: Response) {
    const { stream, contentType } = await this.service.getPaymentReceiptStream(id);
    res.set('Content-Type', contentType ?? 'application/octet-stream');
    stream.pipe(res);
  }

  // Multipart : reçu optionnel (champ "recu") aux côtés de la référence et
  // de l'acceptation des CGU — un seul aller-retour pour l'inscrit.
  @UseGuards(RateLimitGuard('registrations-paiement-public', 10))
  @Post('contrats/:id/paiement')
  @UseInterceptors(
    FileInterceptor('recu', {
      limits: { fileSize: MAX_RECEIPT_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, RECEIPT_MIME_TYPES.includes(file.mimetype));
      },
    }),
  )
  async submitPaymentReferencePublic(
    @Param('id') id: string,
    @Body() dto: SubmitPaymentPublicDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const registration = await this.service.submitPaymentReferencePublic(id, dto);
    if (file) {
      return this.service.uploadPaymentReceipt(id, file);
    }
    return registration;
  }

  // Génère un lien de paiement Papi (Mobile Money/carte) à la volée.
  // Backend conservé mais inutilisé côté produit depuis le retour au flux
  // déclaratif (2026-09-09) — voir schema.prisma.
  @Post('contrats/:id/paiement-en-ligne')
  createPaymentLinkPublic(@Param('id') id: string) {
    return this.service.createPaymentLinkPublic(id);
  }

  // Appelé par Papi (pas par le front) après chaque évolution de statut
  // de paiement — voir RegistrationsService.handlePapiWebhook pour
  // l'authentification (pas de header/signature, Papi n'en fournit pas).
  @UseGuards(RateLimitGuard('registrations-papi-webhook', 30))
  @Post('contrats/:id/paiement-webhook')
  handlePapiWebhook(@Param('id') id: string, @Body() dto: PapiWebhookDto) {
    return this.service.handlePapiWebhook(id, dto);
  }

  @UseGuards(RateLimitGuard('registrations-upload-cv', 10))
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
