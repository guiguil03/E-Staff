import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage.service';
import { EmailService } from '../common/email.service';
import { CreateRegistrationDto } from './create-registration.dto';
import { SubmitPaymentReferenceDto } from './submit-payment-reference.dto';
import { SendContractDto } from './send-contract.dto';
import { generateRegistrationContractPdf } from './registration-contract-pdf';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly email: EmailService,
  ) {}

  create(dto: CreateRegistrationDto) {
    return this.prisma.registration.create({ data: dto });
  }

  // Portail RH — toutes les inscriptions (tous funnels confondus), du plus
  // récent au plus ancien.
  list() {
    return this.prisma.registration.findMany({ orderBy: { createdAt: 'desc' } });
  }

  private async getOrThrow(id: string) {
    const registration = await this.prisma.registration.findUnique({ where: { id } });
    if (!registration) throw new NotFoundException('Inscription introuvable.');
    return registration;
  }

  // L'admin saisit les termes (durée, frais, conditions — pas de modèle
  // figé, variable selon le programme/inscrit, même principe que
  // EvaluationService.validateContract) : génère le PDF, l'envoie par
  // e-mail avec un lien vers la page publique où l'inscrit consultera son
  // contrat et transmettra sa référence de paiement.
  async sendContract(id: string, dto: SendContractDto) {
    const registration = await this.getOrThrow(id);

    const pdf = await generateRegistrationContractPdf({
      prenom: registration.firstName,
      email: registration.email,
      programme: registration.typeFormation ?? registration.segment,
      duree: dto.duree,
      frais: dto.frais,
      conditions: dto.conditions,
    });
    const contractPdfKey = `registration-contracts/${id}.pdf`;
    await this.storage.uploadBuffer(contractPdfKey, pdf, 'application/pdf');

    const link = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/inscription/contrat/${id}`;
    const result = await this.email.send({
      to: registration.email,
      subject: 'Votre contrat de formation e-Staf',
      text: `Bonjour ${registration.firstName},\n\nVotre inscription a été traitée.\n\nVotre contrat de formation (durée, frais, conditions) et les instructions de paiement vous attendent ici :\n${link}\n\nÀ bientôt,\nL'équipe e-Staf`,
    });

    // Même garde que EvaluationService.sendContractNow : un échec réel
    // d'envoi ne doit pas faire passer en "contrat_envoye" silencieusement.
    if (!result.delivered && result.reason !== 'no-provider-configured') {
      throw new BadRequestException(
        `Échec de l'envoi de l'e-mail (${result.reason}) — le contrat n'a pas été marqué comme envoyé.`,
      );
    }

    return this.prisma.registration.update({
      where: { id },
      data: {
        contractDuree: dto.duree,
        contractFrais: dto.frais,
        contractConditions: dto.conditions,
        contractPdfKey,
        status: 'contrat_envoye',
        contractSentAt: new Date(),
      },
    });
  }

  // Accès public (inscrit) — la page contrat n'est accessible que via le
  // lien envoyé par e-mail (id comme jeton), même principe que
  // /evaluation/contrat côté recrutement.
  async getContractInfo(id: string) {
    const registration = await this.getOrThrow(id);
    if (!['contrat_envoye', 'en_attente_paiement', 'converti'].includes(registration.status)) {
      throw new NotFoundException('Contrat pas encore disponible.');
    }
    return {
      status: registration.status,
      prenom: registration.firstName,
      programme: registration.typeFormation ?? registration.segment,
      duree: registration.contractDuree,
      frais: registration.contractFrais,
      conditions: registration.contractConditions,
      paymentReference: registration.paymentReference,
    };
  }

  async getContractPdfStream(id: string) {
    const registration = await this.getOrThrow(id);
    if (!registration.contractPdfKey) {
      throw new NotFoundException('Contrat introuvable pour cette inscription.');
    }
    try {
      return await this.storage.getObjectStream(registration.contractPdfKey);
    } catch {
      throw new NotFoundException('Fichier de contrat introuvable.');
    }
  }

  // Soumission publique — l'inscrit transmet lui-même sa référence Mobile
  // Money / virement depuis la page contrat.
  async submitPaymentReferencePublic(id: string, dto: SubmitPaymentReferenceDto) {
    const registration = await this.getOrThrow(id);
    if (registration.status !== 'contrat_envoye') {
      throw new BadRequestException(
        'Le contrat doit avoir été envoyé avant de transmettre une référence de paiement.',
      );
    }
    return this.prisma.registration.update({
      where: { id },
      data: { paymentReference: dto.reference, status: 'en_attente_paiement' },
    });
  }

  // Repli admin — au cas où l'inscrit transmet sa référence par téléphone
  // plutôt que via la page publique.
  async submitPaymentReference(id: string, dto: SubmitPaymentReferenceDto) {
    return this.submitPaymentReferencePublic(id, dto);
  }

  // Après vérification manuelle par l'admin sur son compte Mobile Money /
  // bancaire — pas de webhook (même principe que EvaluationService.confirmPayment).
  async confirmPayment(id: string) {
    await this.getOrThrow(id);
    return this.prisma.registration.update({
      where: { id },
      data: { status: 'converti', paymentConfirmedAt: new Date() },
    });
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
