import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegistrationForm from "./RegistrationForm";
import { apiPost } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiPost: vi.fn(),
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

  it("utilise le ctaLabel personnalisé quand fourni", () => {
    render(<RegistrationForm segment="dfp" ctaLabel="Je m'inscris" />);
    expect(screen.getByRole("button")).toHaveTextContent("Je m'inscris");
  });
});
