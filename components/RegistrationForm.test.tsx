import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegistrationForm from "./RegistrationForm";
import { apiPost, ApiError } from "@/lib/api";

// ApiError reste la vraie classe (le composant s'en sert pour afficher le
// message renvoyé par le backend) ; seuls les appels réseau sont simulés.
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  apiPost: vi.fn(),
  apiUpload: vi.fn(),
}));

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText("Prénom"), { target: { value: "Awa" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "awa@example.com" } });
  fireEvent.change(screen.getByLabelText("Téléphone"), { target: { value: "0600000000" } });
  fireEvent.click(screen.getByRole("button"));
}

describe("RegistrationForm", () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset();
  });

  it("envoie segment/firstName/email/phone à /registrations et affiche la confirmation", async () => {
    vi.mocked(apiPost).mockResolvedValue({});
    render(<RegistrationForm segment="dfp" />);

    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/est enregistrée/)).toBeInTheDocument();
    });
    expect(apiPost).toHaveBeenCalledWith("/registrations", {
      segment: "dfp",
      firstName: "Awa",
      email: "awa@example.com",
      phone: "0600000000",
    });
  });

  it("désactive le bouton et affiche 'Envoi...' pendant la requête", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    vi.mocked(apiPost).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    render(<RegistrationForm segment="dfp" />);

    fillAndSubmit();

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Envoi...");

    resolveRequest({});
    await waitFor(() => expect(screen.getByText(/est enregistrée/)).toBeInTheDocument());
  });

  it("affiche un message d'erreur si l'inscription échoue, et reste sur le formulaire", async () => {
    vi.mocked(apiPost).mockRejectedValue(new Error("network down"));
    render(<RegistrationForm segment="dfp" />);

    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/Une erreur est survenue/)).toBeInTheDocument();
    });
    // Le formulaire reste affiché (pas de bascule vers l'écran de confirmation).
    expect(screen.getByLabelText("Prénom")).toBeInTheDocument();
  });

  it("affiche le motif renvoyé par le backend (ex. offre clôturée entre-temps)", async () => {
    vi.mocked(apiPost).mockRejectedValue(
      new ApiError("Cette offre est clôturée — vous pouvez rejoindre la liste d'attente.", 400)
    );
    render(<RegistrationForm segment="setter" offreEmploiId="o-1" />);

    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/Cette offre est clôturée/)).toBeInTheDocument();
    });
  });

  it("envoie l'offre visée et le flag liste d'attente", async () => {
    vi.mocked(apiPost).mockResolvedValue({ id: "reg-1" });
    render(<RegistrationForm segment="setter" offreEmploiId="o-1" listeAttente />);

    fillAndSubmit();

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith(
        "/registrations",
        expect.objectContaining({ segment: "setter", offreEmploiId: "o-1", listeAttente: true })
      );
    });
  });

  it("utilise le ctaLabel personnalisé quand fourni", () => {
    render(<RegistrationForm segment="dfp" ctaLabel="Je m'inscris" />);
    expect(screen.getByRole("button")).toHaveTextContent("Je m'inscris");
  });
});
