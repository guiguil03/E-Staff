import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Payload envoyé par Papi sur notificationUrl — champs minimaux dont on a
// besoin pour authentifier et traiter la notification (voir
// RegistrationsService.handlePapiWebhook). Le reste du payload Papi
// (amount, fee, currency, payerPhone...) n'est pas persisté, YAGNI tant
// que l'admin n'en a pas besoin dans l'UI.
export class PapiWebhookDto {
  @IsString() @IsNotEmpty() paymentStatus!: string;
  @IsString() @IsNotEmpty() paymentReference!: string;
  @IsString() @IsOptional() notificationToken?: string;
}
