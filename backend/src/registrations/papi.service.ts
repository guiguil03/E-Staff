import { Injectable, Logger } from '@nestjs/common';

interface CreatePaymentLinkParams {
  clientName: string;
  amount: number;
  reference: string;
  description: string;
  notificationUrl: string;
  successUrl: string;
  failureUrl: string;
  payerEmail?: string;
  payerPhone?: string;
}

interface CreatePaymentLinkResult {
  configured: boolean;
  paymentLink?: string;
  notificationToken?: string;
}

// Génération de lien de paiement Papi (Mobile Money/carte, Madagascar) —
// même stub pattern que DailyService : sans PAPI_API_KEY on ne plante rien,
// on renvoie juste "non configuré" pour que RegistrationsService retombe
// proprement sur le virement manuel plutôt que d'exposer un bouton cassé.
@Injectable()
export class PapiService {
  private readonly logger = new Logger(PapiService.name);

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResult> {
    const apiKey = process.env.PAPI_API_KEY;
    if (!apiKey) {
      this.logger.log(`[papi:stub] lien non créé pour réf=${params.reference} (PAPI_API_KEY absente)`);
      return { configured: false };
    }

    const isTestMode = process.env.PAPI_TEST_MODE !== 'false';

    const res = await fetch('https://app.papi.mg/dashboard/api/payment-links', {
      method: 'POST',
      headers: {
        Token: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientName: params.clientName,
        amount: params.amount,
        reference: params.reference,
        description: params.description,
        notificationUrl: params.notificationUrl,
        successUrl: params.successUrl,
        failureUrl: params.failureUrl,
        payerEmail: params.payerEmail,
        payerPhone: params.payerPhone,
        isTestMode,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Échec de création du lien Papi pour réf=${params.reference}: ${res.status} ${body}`);
      return { configured: true };
    }

    const body = (await res.json()) as {
      data: { paymentLink: string; notificationToken: string };
    };
    return {
      configured: true,
      paymentLink: body.data.paymentLink,
      notificationToken: body.data.notificationToken,
    };
  }
}
