import { Injectable, Logger } from "@nestjs/common";

// Envoi d'e-mail — stub en attendant les identifiants d'un fournisseur réel
// (Resend, SMTP...). En dev, on se contente de logger le contenu. Câbler un
// vrai provider ici quand la cliente fournit les accès (EMAIL_PROVIDER_API_KEY).
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(params: { to: string; subject: string; text: string }) {
    if (!process.env.EMAIL_PROVIDER_API_KEY) {
      this.logger.log(
        `[email:stub] à=${params.to} sujet="${params.subject}"\n${params.text}`
      );
      return { delivered: false, reason: "no-provider-configured" as const };
    }

    // TODO: brancher le vrai provider une fois la clé fournie.
    this.logger.warn("Provider configuré mais non implémenté");
    return { delivered: false, reason: "provider-not-implemented" as const };
  }
}
