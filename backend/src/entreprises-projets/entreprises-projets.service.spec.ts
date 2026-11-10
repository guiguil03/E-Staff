import { EntreprisesProjetsService } from "./entreprises-projets.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEntrepriseProjetDto } from "./create-entreprise-projet.dto";

describe("EntreprisesProjetsService", () => {
  it("horodate le consentement et ne persiste jamais le flag brut", async () => {
    const create = jest.fn().mockResolvedValue({ id: "p-1" });
    const service = new EntreprisesProjetsService({
      entrepriseProjet: { create },
    } as unknown as PrismaService);

    const dto: CreateEntrepriseProjetDto = {
      companyName: "Acme SARL",
      taxId: "STAT-123",
      sector: "Support client",
      address: "Antananarivo",
      country: "Madagascar",
      contactName: "Hery",
      contactRole: "DG",
      email: "hery@acme.mg",
      phone: "0340000000",
      serviceType: "Squad commerciale",
      teamSize: "10-20",
      startDate: "2026-11-01",
      needsDetails: "Externalisation d'une squad de 10 closers.",
      consent: true,
    };

    await service.create(dto);

    const { data } = create.mock.calls[0][0];
    expect(data.consentAt).toBeInstanceOf(Date);
    expect(data).not.toHaveProperty("consent");
    expect(data.companyName).toBe("Acme SARL");
  });

  describe("enregistrerReservationCal", () => {
    function setup(projet: Record<string, unknown> | null) {
      const update = jest.fn().mockResolvedValue({});
      const findFirst = jest.fn().mockResolvedValue(projet);
      const service = new EntreprisesProjetsService({
        entrepriseProjet: { findFirst, update },
      } as unknown as PrismaService);
      return { service, update, findFirst };
    }
    const debut = new Date("2026-11-20T09:00:00Z");

    it("enregistre le créneau et passe une demande 'nouveau' en 'contacte'", async () => {
      const { service, update } = setup({ id: "p1", status: "nouveau", rdvCalUid: null });
      const r = await service.enregistrerReservationCal({
        type: "BOOKING_CREATED", uid: "u1", debut, lien: "https://visio/x", emails: [" Hery@Acme.mg "],
      });
      expect(r.matched).toBe(true);
      expect(update.mock.calls[0][0].data).toMatchObject({
        rdvDebut: debut, rdvLien: "https://visio/x", rdvCalUid: "u1", rdvStatut: "confirme", status: "contacte",
      });
    });

    it("ne rétrograde pas un statut plus avancé", async () => {
      const { service, update } = setup({ id: "p1", status: "qualifie", rdvCalUid: null });
      await service.enregistrerReservationCal({
        type: "BOOKING_RESCHEDULED", uid: "u2", debut, lien: null, emails: ["a@b.c"],
      });
      expect(update.mock.calls[0][0].data).not.toHaveProperty("status");
    });

    it("ignore une réservation sans demande correspondante", async () => {
      const { service, update } = setup(null);
      const r = await service.enregistrerReservationCal({
        type: "BOOKING_CREATED", uid: "u1", debut, lien: null, emails: ["inconnu@x.y"],
      });
      expect(r.matched).toBe(false);
      expect(update).not.toHaveBeenCalled();
    });

    it("marque le rendez-vous annulé", async () => {
      const { service, update } = setup({ id: "p1", status: "contacte", rdvCalUid: "u1" });
      await service.enregistrerReservationCal({
        type: "BOOKING_CANCELLED", uid: "u1", debut, lien: null, emails: [],
      });
      expect(update.mock.calls[0][0].data).toEqual({ rdvStatut: "annule" });
    });

    it("n'annule pas si le créneau annulé a déjà été remplacé (autre uid)", async () => {
      const { service, update, findFirst } = setup(null);
      findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "p1", rdvCalUid: "u-nouveau" });
      const r = await service.enregistrerReservationCal({
        type: "BOOKING_CANCELLED", uid: "u-ancien", debut, lien: null, emails: ["a@b.c"],
      });
      expect(r.matched).toBe(false);
      expect(update).not.toHaveBeenCalled();
    });
  });
});
