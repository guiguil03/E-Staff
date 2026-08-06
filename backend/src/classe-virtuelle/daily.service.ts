import { Injectable, Logger } from "@nestjs/common";

interface CreateRoomResult {
  configured: boolean;
  roomName?: string;
  roomUrl?: string;
}

// Création de salle Daily.co — stub en attendant la clé API (DAILY_API_KEY),
// même logique que EmailService/CalendarEmbed : on ne fait jamais planter le
// flux de planification faute de fournisseur configuré, on renvoie un état
// "non configuré" que le front affiche honnêtement ("Bientôt disponible").
@Injectable()
export class DailyService {
  private readonly logger = new Logger(DailyService.name);

  async createRoom(seanceId: string, expUnixSeconds: number): Promise<CreateRoomResult> {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      this.logger.log(`[daily:stub] salle non créée pour la séance ${seanceId} (DAILY_API_KEY absente)`);
      return { configured: false };
    }

    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: seanceId,
        properties: {
          exp: expUnixSeconds,
          enable_prejoin_ui: true,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      this.logger.error(`Échec de création de salle Daily pour ${seanceId}: ${res.status} ${body}`);
      return { configured: true };
    }

    const data = (await res.json()) as { name: string; url: string };
    return { configured: true, roomName: data.name, roomUrl: data.url };
  }

  // Jeton de réunion nominatif — permet aux webhooks de présence
  // (participant.joined/left) de rattacher un participant à un vrai
  // apprenant/formateur via user_id, plutôt qu'un simple lien de salle
  // anonyme. Retourne null si le fournisseur n'est pas configuré (même
  // logique stub que createRoom) ; l'appelant retombe alors sur l'URL de
  // salle nue.
  async mintMeetingToken(params: {
    roomName: string;
    userId: string;
    userName: string;
    isOwner: boolean;
  }): Promise<string | null> {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) return null;

    const res = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          room_name: params.roomName,
          user_id: params.userId,
          user_name: params.userName,
          is_owner: params.isOwner,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      this.logger.error(`Échec de création de jeton Daily pour ${params.roomName}: ${res.status} ${body}`);
      return null;
    }

    const data = (await res.json()) as { token: string };
    return data.token;
  }

  // Crée le webhook de présence côté Daily (participant.joined/left) —
  // appelé une seule fois via l'endpoint d'amorçage (voir
  // daily-webhook.controller.ts POST /admin/daily-webhook/setup), pas au
  // démarrage de l'app : le secret HMAC n'est renvoyé qu'à la création et
  // doit être copié dans DAILY_WEBHOOK_SECRET manuellement.
  async createWebhook(targetUrl: string): Promise<{ uuid: string; hmac: string } | null> {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) return null;

    const res = await fetch("https://api.daily.co/v1/webhooks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: targetUrl,
        eventTypes: ["participant.joined", "participant.left"],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      this.logger.error(`Échec de création du webhook Daily: ${res.status} ${body}`);
      return null;
    }

    const data = (await res.json()) as { uuid: string; hmac: string };
    return data;
  }
}
