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
  UseGuards,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { FormateurGuard } from "../common/formateur.guard";
import { DailyService } from "./daily.service";
import { PresenceService } from "./presence.service";

interface DailyWebhookPayload {
  type: string;
  payload: {
    room: string;
    user_id?: string;
    user_name?: string;
    session_id: string;
    joined_at?: number;
    left_at?: number;
  };
}

function verifySignature(rawBody: Buffer, timestamp: string, signature: string, secretBase64: string): boolean {
  const secret = Buffer.from(secretBase64, "base64");
  const signatureString = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = createHmac("sha256", secret).update(signatureString).digest("base64");
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signature);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

@Controller()
export class DailyWebhookController {
  constructor(
    private readonly presence: PresenceService,
    private readonly daily: DailyService
  ) {}

  // Reçoit participant.joined/participant.left de Daily et alimente la
  // table Presence — voir daily.service.ts et le doc officiel
  // https://docs.daily.co/reference/rest-api/webhooks pour le format de
  // signature. Le secret (DAILY_WEBHOOK_SECRET) n'est disponible qu'après
  // avoir appelé POST /admin/daily-webhook/setup une fois.
  @Post("webhooks/daily")
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-webhook-signature") signature: string,
    @Headers("x-webhook-timestamp") timestamp: string,
    @Body() body: DailyWebhookPayload
  ) {
    const secret = process.env.DAILY_WEBHOOK_SECRET;
    if (!secret) throw new UnauthorizedException("Webhook non configuré.");
    if (!req.rawBody || !signature || !timestamp) {
      throw new BadRequestException("Requête webhook incomplète.");
    }
    if (!verifySignature(req.rawBody, timestamp, signature, secret)) {
      throw new UnauthorizedException("Signature invalide.");
    }

    if (body.type === "participant.joined") {
      await this.presence.recordJoin(body.payload);
    } else if (body.type === "participant.left") {
      await this.presence.recordLeave(body.payload);
    }

    return { ok: true };
  }

  // Amorçage à usage unique : crée le webhook côté Daily et renvoie le
  // secret HMAC (uniquement visible à la création) pour qu'il soit copié
  // dans DAILY_WEBHOOK_SECRET. Pas d'appel automatique au démarrage — le
  // secret ne serait sinon récupérable nulle part après coup.
  @Post("admin/daily-webhook/setup")
  @UseGuards(FormateurGuard)
  async setupWebhook() {
    const backendUrl = process.env.BACKEND_PUBLIC_URL;
    if (!backendUrl) {
      throw new BadRequestException("BACKEND_PUBLIC_URL non configurée.");
    }
    const result = await this.daily.createWebhook(`${backendUrl}/webhooks/daily`);
    if (!result) {
      throw new BadRequestException("DAILY_API_KEY non configurée ou échec de création.");
    }
    return result;
  }
}
