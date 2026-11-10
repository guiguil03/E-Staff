import { createHmac } from "crypto";
import { extraireLienCal, verifierSignatureCal } from "./cal-webhook.controller";

describe("webhook Cal.com", () => {
  it("vérifie la signature HMAC-SHA256 hex du corps brut", () => {
    const body = Buffer.from('{"triggerEvent":"BOOKING_CREATED"}');
    const sig = createHmac("sha256", "secret").update(body).digest("hex");
    expect(verifierSignatureCal(body, sig, "secret")).toBe(true);
    expect(verifierSignatureCal(body, sig, "autre")).toBe(false);
    expect(verifierSignatureCal(body, "abc", "secret")).toBe(false);
  });

  it("extrait le lien de visio, sinon la page de réservation", () => {
    expect(extraireLienCal({ uid: "u", metadata: { videoCallUrl: "https://v/1" } })).toBe("https://v/1");
    expect(extraireLienCal({ uid: "u", additionalInformation: { hangoutLink: "https://meet/x" } })).toBe("https://meet/x");
    expect(extraireLienCal({ uid: "u", location: "Antananarivo" })).toBe("https://app.cal.com/booking/u");
  });
});
