import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage.service';
import { EmailService } from '../common/email.service';
import { renderEmailHtml, emailParagraph, ctaButton } from '../common/email-template';
import { CreateRegistrationDto } from './create-registration.dto';
import { SubmitPaymentReferenceDto } from './submit-payment-reference.dto';
import { SubmitPaymentPublicDto } from './submit-payment-public.dto';
import { SendContractDto } from './send-contract.dto';
import { PapiWebhookDto } from './papi-webhook.dto';
import { generateRegistrationContractPdf } from './registration-contract-pdf';
import { PapiService } from './papi.service';
import { OffresEmploiService } from '../offres-emploi/offres-emploi.service';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

const RECEIPT_MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly email: EmailService,
    private readonly papi: PapiService,
    private readonly offresEmploi: OffresEmploiService,
  ) {}

  async create(dto: CreateRegistrationDto) {
    // Candidature sur une offre précise : l'offre doit exister, être
    // publiée et encore ouverte (sauf inscription en liste d'attente).
    if (dto.offreEmploiId) {
      await this.offresEmploi.verifierCandidature(dto.offreEmploiId, dto.listeAttente ?? false);
    }
    return this.prisma.registration.create({ data: dto });
  }

  // Portail RH — toutes les inscriptions (tous funnels confondus), du plus
  // récent au plus ancien.
  list() {
    return this.prisma.registration.findMany({
      orderBy: { createdAt: 'desc' },
      // Offre d'emploi visée (Studio Métier), affichée dans la liste RH.
      include: { offreEmploi: { select: { id: true, titre: true } } },
    });
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
      html: renderEmailHtml({
        title: 'Votre contrat de formation',
        preheader: 'Contrat et instructions de paiement',
        bodyHtml:
          emailParagraph(`Bonjour ${registration.firstName},`) +
          emailParagraph('Votre inscription a été traitée.') +
          emailParagraph('Votre contrat de formation (durée, frais, conditions) et les instructions de paiement vous attendent ici :') +
          ctaButton('Consulter mon contrat', link),
      }),
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
        paymentAmount: dto.montant ?? null,
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
      paymentMethod: registration.paymentMethod,
      hasReceipt: Boolean(registration.paymentReceiptKey),
      // Coordonnées de paiement affichées telles quelles — texte libre en
      // variables d'environnement, vide = bloc masqué côté front. Valeurs
      // à renseigner par l'équipe e-Staf (voir .env.example).
      paymentInfo: {
        mobileMoneyMg: process.env.PAYMENT_INFO_MOBILE_MONEY_MG || null,
        ribLocal: process.env.PAYMENT_INFO_RIB_LOCAL || null,
        international: process.env.PAYMENT_INFO_INTERNATIONAL || null,
      },
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

  // Consultation du reçu par l'admin, pour la vérification manuelle (voir
  // InscriptionsPanel).
  async getPaymentReceiptStream(id: string) {
    const registration = await this.getOrThrow(id);
    if (!registration.paymentReceiptKey) {
      throw new NotFoundException('Aucun reçu déposé pour cette inscription.');
    }
    try {
      return await this.storage.getObjectStream(registration.paymentReceiptKey);
    } catch {
      throw new NotFoundException('Fichier de reçu introuvable.');
    }
  }

  // Soumission publique — l'inscrit transmet lui-même sa référence Mobile
  // Money / virement depuis la page contrat, en acceptant les CGU
  // (obligatoire, voir /conditions-generales et SubmitPaymentPublicDto).
  async submitPaymentReferencePublic(id: string, dto: SubmitPaymentPublicDto) {
    const registration = await this.getOrThrow(id);
    if (registration.status !== 'contrat_envoye') {
      throw new BadRequestException(
        'Le contrat doit avoir été envoyé avant de transmettre une référence de paiement.',
      );
    }
    return this.prisma.registration.update({
      where: { id },
      data: {
        paymentReference: dto.reference,
        cguAcceptedAt: new Date(),
        status: 'en_attente_paiement',
      },
    });
  }

  // Reçu/capture d'écran de la transaction, optionnel — déposé avec la
  // référence de paiement (voir controller) pour accélérer la vérification
  // manuelle par l'admin. Même principe de clé stable que uploadCv.
  async uploadPaymentReceipt(id: string, file: Express.Multer.File) {
    await this.getOrThrow(id);
    const extension = RECEIPT_MIME_EXTENSIONS[file.mimetype] ?? 'bin';
    const key = `registrations/${id}/recu-paiement.${extension}`;
    await this.storage.uploadBuffer(key, file.buffer, file.mimetype);
    return this.prisma.registration.update({
      where: { id },
      data: { paymentReceiptKey: key },
    });
  }

  // Repli admin — au cas où l'inscrit transmet sa référence par téléphone
  // plutôt que via la page publique. Pas de CGU ici : consentement obtenu
  // verbalement par l'admin, hors flux de soumission en ligne.
  async submitPaymentReference(id: string, dto: SubmitPaymentReferenceDto) {
    const registration = await this.getOrThrow(id);
    return this.prisma.registration.update({
      where: { id: registration.id },
      data: { paymentReference: dto.reference, status: 'en_attente_paiement' },
    });
  }

  // Après vérification manuelle par l'admin sur son compte Mobile Money /
  // bancaire — pas de webhook (même principe que EvaluationService.confirmPayment).
  async confirmPayment(id: string) {
    await this.getOrThrow(id);
    return this.prisma.registration.update({
      where: { id },
      data: { status: 'converti', paymentMethod: 'manuel', paymentConfirmedAt: new Date() },
    });
  }

  // Accès public — génère un lien de paiement Papi à la volée (pas de
  // pré-génération à l'envoi du contrat : validDuration est courte côté
  // Papi, autant créer le lien au moment où l'inscrit clique réellement).
  // Une nouvelle référence est générée à chaque appel, Papi exigeant une
  // référence unique par tentative de paiement.
  async createPaymentLinkPublic(id: string) {
    const registration = await this.getOrThrow(id);
    if (registration.status !== 'contrat_envoye') {
      throw new BadRequestException('Le paiement en ligne n\'est disponible qu\'après réception du contrat.');
    }
    if (!registration.paymentAmount) {
      throw new BadRequestException('Montant à payer non défini — contactez l\'équipe e-Staf.');
    }

    const backendUrl = (process.env.BACKEND_PUBLIC_URL ?? '').replace(/\/+$/, '');
    const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
    const reference = `reg-${id}-${Date.now()}`;

    const link = await this.papi.createPaymentLink({
      clientName: registration.firstName,
      amount: registration.paymentAmount,
      reference,
      description: `Frais de formation e-Staf — ${registration.typeFormation ?? registration.segment}`,
      notificationUrl: `${backendUrl}/registrations/contrats/${id}/paiement-webhook`,
      successUrl: `${frontendUrl}/inscription/contrat/${id}?paiement=succes`,
      failureUrl: `${frontendUrl}/inscription/contrat/${id}?paiement=echec`,
      payerEmail: registration.email,
      payerPhone: registration.phone,
    });

    if (!link.configured || !link.paymentLink) {
      throw new BadRequestException(
        'Paiement en ligne indisponible pour le moment — utilisez le virement bancaire ci-dessous.',
      );
    }

    await this.prisma.registration.update({
      where: { id },
      data: { papiReference: reference, papiNotificationToken: link.notificationToken },
    });

    return { paymentLink: link.paymentLink };
  }

  // Webhook Papi — pas de signature cryptographique fournie par Papi, on
  // authentifie donc la notification en comparant référence + token à ceux
  // stockés lors de la création du lien (voir createPaymentLinkPublic).
  // notificationToken est le vrai porteur de secret ici (pas juste un
  // identifiant comme paymentReference) : comparé en temps constant pour
  // éviter qu'une attaque par timing sur cet endpoint public ne permette de
  // le reconstituer caractère par caractère (même principe que la
  // vérification HMAC des webhooks Daily — voir daily-webhook.controller.ts).
  // Idempotent : rejouer la même notification (SUCCESS) après confirmation
  // ne fait rien de plus.
  async handlePapiWebhook(id: string, dto: PapiWebhookDto) {
    const registration = await this.getOrThrow(id);

    const authentic =
      registration.papiReference &&
      registration.papiNotificationToken &&
      dto.paymentReference === registration.papiReference &&
      typeof dto.notificationToken === 'string' &&
      safeEqual(dto.notificationToken, registration.papiNotificationToken);
    if (!authentic) {
      throw new BadRequestException('Notification de paiement non reconnue.');
    }

    if (dto.paymentStatus !== 'SUCCESS' || registration.status === 'converti') {
      return registration;
    }

    return this.prisma.registration.update({
      where: { id },
      data: { status: 'converti', paymentMethod: 'papi', paymentConfirmedAt: new Date() },
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
