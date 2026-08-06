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
}
