import { Injectable, Logger } from "@nestjs/common";

// Envoi d'e-mail via l'API HTTP de Resend (pas de SDK — un simple fetch
// suffit pour un seul endpoint, évite une dépendance de plus). En l'absence
// de clé (EMAIL_PROVIDER_API_KEY), reste en mode simulation : le contenu est
// juste loggé, aucun envoi réel n'est tenté — utile en dev pour ne pas
// spammer de vraies adresses avec des données de test.
//
// EMAIL_FROM_ADDRESS : adresse d'expéditeur. `onboarding@resend.dev` (défaut
// Resend) fonctionne sans domaine vérifié, mais Resend recommande de
// vérifier un domaine à vous pour la production — à définir dès qu'un
// domaine e-Staf est vérifié dans Resend.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(params: { to: string; subject: string; text: string; html?: string }) {
    const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
    if (!apiKey) {
      this.logger.log(
        `[email:stub] à=${params.to} sujet="${params.subject}"\n${params.text}`
      );
      return { delivered: false, reason: "no-provider-configured" as const };
    }

    const from = process.env.EMAIL_FROM_ADDRESS ?? "onboarding@resend.dev";

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: params.to,
          subject: params.subject,
          text: params.text,
          ...(params.html ? { html: params.html } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        this.logger.error(`Échec d'envoi Resend (${res.status}) à=${params.to} : ${body}`);
        return { delivered: false, reason: "provider-error" as const };
      }

      return { delivered: true as const };
    } catch (err) {
      this.logger.error(`Erreur réseau lors de l'envoi Resend à=${params.to}`, err as Error);
      return { delivered: false, reason: "network-error" as const };
    }
  }
}
