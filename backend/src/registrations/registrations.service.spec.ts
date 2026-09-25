import { BadRequestException } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage.service';
import { EmailService } from '../common/email.service';
import { PapiService } from './papi.service';
import { OffresEmploiService } from '../offres-emploi/offres-emploi.service';

// Se concentre sur la logique de paiement (lien Papi + webhook) — la partie
// la plus sensible du module car elle décide seule de basculer une
// inscription en "converti", voir la discussion sur RegistrationsService.

function makePrismaMock() {
  return {
    registration: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };
}

const BASE_REGISTRATION = {
  id: 'reg-1',
  firstName: 'Fanja',
  email: 'fanja@example.com',
  phone: '0341234567',
  segment: 'examens',
  typeFormation: null,
  status: 'contrat_envoye',
  paymentAmount: 500000,
  paymentReference: null,
  paymentReceiptKey: null,
  paymentMethod: null,
  cguAcceptedAt: null,
  papiReference: null,
  papiNotificationToken: null,
};

describe('RegistrationsService — paiement', () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let storage: { uploadBuffer: jest.Mock };
  let papi: { createPaymentLink: jest.Mock };
  let offresEmploi: { verifierCandidature: jest.Mock };
  let service: RegistrationsService;

  beforeEach(() => {
    prisma = makePrismaMock();
    storage = { uploadBuffer: jest.fn().mockResolvedValue(undefined) };
    papi = { createPaymentLink: jest.fn() };
    offresEmploi = { verifierCandidature: jest.fn().mockResolvedValue({}) };
    service = new RegistrationsService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
      {} as unknown as EmailService,
      papi as unknown as PapiService,
      offresEmploi as unknown as OffresEmploiService,
    );
  });

  describe('create', () => {
    const base = { segment: 'setter', firstName: 'Awa', email: 'awa@example.com', phone: '0340000000' };

    it("vérifie l'offre choisie avant d'enregistrer la candidature", async () => {
      prisma.registration.create.mockResolvedValue({ id: 'reg-9' });
      await service.create({ ...base, offreEmploiId: 'o-1' });
      expect(offresEmploi.verifierCandidature).toHaveBeenCalledWith('o-1', false);
      expect(prisma.registration.create).toHaveBeenCalled();
    });

    it("n'enregistre rien si l'offre est refusée (clôturée)", async () => {
      offresEmploi.verifierCandidature.mockRejectedValue(new BadRequestException('clôturée'));
      await expect(service.create({ ...base, offreEmploiId: 'o-1' })).rejects.toThrow(BadRequestException);
      expect(prisma.registration.create).not.toHaveBeenCalled();
    });

    it('ne vérifie aucune offre pour une candidature spontanée', async () => {
      prisma.registration.create.mockResolvedValue({ id: 'reg-10' });
      await service.create(base);
      expect(offresEmploi.verifierCandidature).not.toHaveBeenCalled();
    });
  });

  describe('createPaymentLinkPublic', () => {
    it("rejette si le contrat n'a pas été envoyé", async () => {
      prisma.registration.findUnique.mockResolvedValue({ ...BASE_REGISTRATION, status: 'nouveau' });
      await expect(service.createPaymentLinkPublic('reg-1')).rejects.toThrow(BadRequestException);
    });

    it('rejette si aucun montant n\'a été fixé', async () => {
      prisma.registration.findUnique.mockResolvedValue({ ...BASE_REGISTRATION, paymentAmount: null });
      await expect(service.createPaymentLinkPublic('reg-1')).rejects.toThrow(BadRequestException);
    });

    it('rejette proprement si Papi n\'est pas configuré', async () => {
      prisma.registration.findUnique.mockResolvedValue(BASE_REGISTRATION);
      papi.createPaymentLink.mockResolvedValue({ configured: false });
      await expect(service.createPaymentLinkPublic('reg-1')).rejects.toThrow(BadRequestException);
      expect(prisma.registration.update).not.toHaveBeenCalled();
    });

    it('stocke la référence/token générés et renvoie le lien Papi', async () => {
      prisma.registration.findUnique.mockResolvedValue(BASE_REGISTRATION);
      papi.createPaymentLink.mockResolvedValue({
        configured: true,
        paymentLink: 'https://payment-form.papi.mg/estaf/payments/abc',
        notificationToken: 'tok-123',
      });
      prisma.registration.update.mockResolvedValue({});

      const result = await service.createPaymentLinkPublic('reg-1');

      expect(result).toEqual({ paymentLink: 'https://payment-form.papi.mg/estaf/payments/abc' });
      expect(papi.createPaymentLink).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 500000, payerEmail: 'fanja@example.com' }),
      );
      expect(prisma.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg-1' },
        data: expect.objectContaining({ papiNotificationToken: 'tok-123' }),
      });
    });
  });

  describe('handlePapiWebhook', () => {
    const CONFIRMED = {
      ...BASE_REGISTRATION,
      papiReference: 'reg-reg-1-1700000000000',
      papiNotificationToken: 'tok-123',
    };

    it('rejette une notification dont la référence ne correspond pas', async () => {
      prisma.registration.findUnique.mockResolvedValue(CONFIRMED);
      await expect(
        service.handlePapiWebhook('reg-1', {
          paymentStatus: 'SUCCESS',
          paymentReference: 'autre-ref',
          notificationToken: 'tok-123',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.registration.update).not.toHaveBeenCalled();
    });

    it('rejette une notification dont le token ne correspond pas', async () => {
      prisma.registration.findUnique.mockResolvedValue(CONFIRMED);
      await expect(
        service.handlePapiWebhook('reg-1', {
          paymentStatus: 'SUCCESS',
          paymentReference: 'reg-reg-1-1700000000000',
          notificationToken: 'mauvais-token',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('confirme le paiement sur un statut SUCCESS authentique', async () => {
      prisma.registration.findUnique.mockResolvedValue(CONFIRMED);
      prisma.registration.update.mockResolvedValue({ ...CONFIRMED, status: 'converti' });

      await service.handlePapiWebhook('reg-1', {
        paymentStatus: 'SUCCESS',
        paymentReference: 'reg-reg-1-1700000000000',
        notificationToken: 'tok-123',
      });

      expect(prisma.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg-1' },
        data: expect.objectContaining({ status: 'converti', paymentMethod: 'papi' }),
      });
    });

    it('ne change rien sur un statut FAILED authentique', async () => {
      prisma.registration.findUnique.mockResolvedValue(CONFIRMED);

      await service.handlePapiWebhook('reg-1', {
        paymentStatus: 'FAILED',
        paymentReference: 'reg-reg-1-1700000000000',
        notificationToken: 'tok-123',
      });

      expect(prisma.registration.update).not.toHaveBeenCalled();
    });

    it('est idempotent si déjà converti', async () => {
      prisma.registration.findUnique.mockResolvedValue({ ...CONFIRMED, status: 'converti' });

      await service.handlePapiWebhook('reg-1', {
        paymentStatus: 'SUCCESS',
        paymentReference: 'reg-reg-1-1700000000000',
        notificationToken: 'tok-123',
      });

      expect(prisma.registration.update).not.toHaveBeenCalled();
    });
  });

  describe('submitPaymentReferencePublic — flux déclaratif', () => {
    it('rejette si le contrat n\'a pas été envoyé', async () => {
      prisma.registration.findUnique.mockResolvedValue({ ...BASE_REGISTRATION, status: 'nouveau' });
      await expect(
        service.submitPaymentReferencePublic('reg-1', { reference: 'REF123', cguAccepted: 'true' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('enregistre la référence et la date d\'acceptation des CGU', async () => {
      prisma.registration.findUnique.mockResolvedValue(BASE_REGISTRATION);
      prisma.registration.update.mockResolvedValue({});

      await service.submitPaymentReferencePublic('reg-1', {
        reference: 'REF123',
        cguAccepted: 'true',
      });

      expect(prisma.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg-1' },
        data: expect.objectContaining({
          paymentReference: 'REF123',
          status: 'en_attente_paiement',
          cguAcceptedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('uploadPaymentReceipt', () => {
    it('uploade le reçu sous une clé stable et l\'enregistre en base', async () => {
      prisma.registration.findUnique.mockResolvedValue(BASE_REGISTRATION);
      prisma.registration.update.mockResolvedValue({});
      const file = { mimetype: 'image/png', buffer: Buffer.from('x') } as Express.Multer.File;

      await service.uploadPaymentReceipt('reg-1', file);

      expect(storage.uploadBuffer).toHaveBeenCalledWith(
        'registrations/reg-1/recu-paiement.png',
        file.buffer,
        'image/png',
      );
      expect(prisma.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg-1' },
        data: { paymentReceiptKey: 'registrations/reg-1/recu-paiement.png' },
      });
    });
  });

  describe('submitPaymentReference — repli admin', () => {
    it('enregistre la référence sans exiger de CGU', async () => {
      prisma.registration.findUnique.mockResolvedValue(BASE_REGISTRATION);
      prisma.registration.update.mockResolvedValue({});

      await service.submitPaymentReference('reg-1', { reference: 'REF-TEL' });

      expect(prisma.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg-1' },
        data: { paymentReference: 'REF-TEL', status: 'en_attente_paiement' },
      });
    });
  });
});
