import { createHmac, timingSafeEqual } from "crypto";
import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { EntreprisesProjetsService, type ReservationCal } from "./entreprises-projets.service";

interface CalWebhookBody {
  triggerEvent?: string;
  payload?: {
    uid?: string;
    startTime?: string;
    location?: string | null;
    attendees?: { email?: string }[];
    metadata?: { videoCallUrl?: string } | null;
    videoCallData?: { url?: string } | null;
    additionalInformation?: { hangoutLink?: string } | null;
  };
}

const EVENTS = ["BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED"] as const;

// Cal.com signe le corps brut en HMAC-SHA256 (hex) dans X-Cal-Signature-256.
export function verifierSignatureCal(rawBody: Buffer, signature: string, secret: string): boolean {
  const attendu = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(attendu);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Lien de salle : visio Cal Video / Zoom (videoCallUrl), Google Meet
// (hangoutLink), ou un lieu saisi sous forme d'URL ; à défaut la page de
// réservation Cal.com, qui contient le lien de connexion.
export function extraireLienCal(payload: NonNullable<CalWebhookBody["payload"]>): string | null {
  const candidats = [
    payload.metadata?.videoCallUrl,
    payload.videoCallData?.url,
    payload.additionalInformation?.hangoutLink,
    payload.location,
  ];
  const url = candidats.find((c) => typeof c === "string" && /^https?:\/\//i.test(c));
  if (url) return url;
  return payload.uid ? `https://app.cal.com/booking/${payload.uid}` : null;
}

@ApiTags("Webhooks")
@Controller()
export class CalWebhookController {
  constructor(private readonly service: EntreprisesProjetsService) {}

  // À déclarer côté Cal.com (Settings > Developer > Webhooks) avec les
  // triggers BOOKING_CREATED / RESCHEDULED / CANCELLED et le même secret
  // que CAL_WEBHOOK_SECRET.
  @Post("webhooks/cal")
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-cal-signature-256") signature: string,
    @Body() body: CalWebhookBody
  ) {
    const secret = process.env.CAL_WEBHOOK_SECRET;
    if (!secret) throw new UnauthorizedException("Webhook non configuré.");
    if (!req.rawBody || !signature) throw new BadRequestException("Requête webhook incomplète.");
    if (!verifierSignatureCal(req.rawBody, signature, secret)) {
      throw new UnauthorizedException("Signature invalide.");
    }

    const type = body.triggerEvent as ReservationCal["type"];
    const payload = body.payload;
    // Autres événements (ex. MEETING_ENDED) : accusés sans traitement.
    if (!EVENTS.includes(type) || !payload?.uid) return { ok: true, matched: false };

    const debut = payload.startTime ? new Date(payload.startTime) : null;
    if (type !== "BOOKING_CANCELLED" && (!debut || Number.isNaN(debut.getTime()))) {
      throw new BadRequestException("Date de rendez-vous invalide.");
    }

    const result = await this.service.enregistrerReservationCal({
      type,
      uid: payload.uid,
      debut: debut ?? new Date(0),
      lien: extraireLienCal(payload),
      emails: (payload.attendees ?? []).map((a) => a.email ?? ""),
    });
    return { ok: true, ...result };
  }
}
