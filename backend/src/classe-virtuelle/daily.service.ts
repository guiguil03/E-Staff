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
// Événements reçus sur /webhooks/daily : présence (PresenceService) et
// enregistrements cloud (EnregistrementService).
export const DAILY_WEBHOOK_EVENT_TYPES = [
  "participant.joined",
  "participant.left",
  "recording.ready-to-download",
  "recording.error",
];

// Enregistrement cloud des classes virtuelles — option payante du compte
// Daily, activée explicitement (DAILY_RECORDING_ENABLED=true) pour ne jamais
// créer de salle qui échouerait ou facturerait sans que la cliente l'ait
// décidé.
export function recordingEnabled(): boolean {
  return process.env.DAILY_RECORDING_ENABLED === "true";
}

@Injectable()
export class DailyService {
  private readonly logger = new Logger(DailyService.name);

  // broadcastOnly: true (Forum "Live du mois") active owner_only_broadcast
  // côté Daily — seul le titulaire du jeton is_owner a caméra/micro, tout
  // le monde d'autre est spectateur en lecture seule. false (classes
  // virtuelles) laisse tout le monde parler, comportement par défaut.
  async createRoom(
    roomId: string,
    expUnixSeconds: number,
    broadcastOnly = false
  ): Promise<CreateRoomResult> {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      this.logger.log(`[daily:stub] salle non créée pour ${roomId} (DAILY_API_KEY absente)`);
      return { configured: false };
    }

    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomId,
        properties: {
          exp: expUnixSeconds,
          enable_prejoin_ui: true,
          ...(broadcastOnly ? { owner_only_broadcast: true } : {}),
          // Classes virtuelles uniquement (pas les Lives du Forum, créés
          // en broadcastOnly).
          ...(recordingEnabled() && !broadcastOnly ? { enable_recording: "cloud" } : {}),
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      this.logger.error(`Échec de création de salle Daily pour ${roomId}: ${res.status} ${body}`);
      return { configured: true };
    }

    const data = (await res.json()) as { name: string; url: string };
    return { configured: true, roomName: data.name, roomUrl: data.url };
  }

  // Supprime la salle Daily — appelé quand une planification est annulée
  // (voir ClasseVirtuelleService.cancelSeance) pour ne pas laisser de salles
  // orphelines actives côté Daily. Silencieux si non configuré ou déjà
  // supprimée (404) : l'annulation côté e-Staf ne doit jamais échouer pour
  // ça.
  async deleteRoom(roomName: string): Promise<void> {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) return;

    const res = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok && res.status !== 404) {
      const body = await res.text().catch(() => "");
      this.logger.error(`Échec de suppression de salle Daily ${roomName}: ${res.status} ${body}`);
    }
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
    /** Démarre l'enregistrement cloud dès que ce participant rejoint. */
    startRecording?: boolean;
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
          ...(params.startRecording ? { enable_recording: "cloud", start_cloud_recording: true } : {}),
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
        eventTypes: DAILY_WEBHOOK_EVENT_TYPES,
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

  // Ajoute les événements d'enregistrement au webhook déjà en place (créé
  // avant cette fonctionnalité avec seulement participant.*) sans le
  // recréer — le secret HMAC (DAILY_WEBHOOK_SECRET) reste donc valable.
  async ensureWebhookEventTypes(targetUrl: string): Promise<{ updated: number } | null> {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) return null;

    const res = await fetch("https://api.daily.co/v1/webhooks", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      this.logger.error(`Échec de lecture des webhooks Daily: ${res.status}`);
      return null;
    }
    const webhooks = (await res.json()) as { uuid: string; url: string }[];
    let updated = 0;
    for (const hook of webhooks.filter((w) => w.url === targetUrl)) {
      const upd = await fetch(`https://api.daily.co/v1/webhooks/${hook.uuid}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, eventTypes: DAILY_WEBHOOK_EVENT_TYPES }),
      });
      if (upd.ok) updated += 1;
      else this.logger.error(`Échec de mise à jour du webhook Daily ${hook.uuid}: ${upd.status}`);
    }
    return { updated };
  }

  // Lien de lecture/téléchargement temporaire d'un enregistrement cloud
  // (la vidéo reste chez Daily ; le lien expire après quelques heures).
  async getRecordingAccessLink(recordingId: string): Promise<{ url: string; expires: number | null } | null> {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(`https://api.daily.co/v1/recordings/${recordingId}/access-link`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      this.logger.error(`Échec du lien d'accès à l'enregistrement ${recordingId}: ${res.status} ${body}`);
      return null;
    }
    const data = (await res.json()) as { download_link: string; expires?: number };
    return { url: data.download_link, expires: data.expires ?? null };
  }
}
