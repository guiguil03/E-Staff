import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { apiPost } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiPost: vi.fn(),
}));

function fillAndSubmit(matricule: string) {
  fireEvent.change(screen.getByLabelText("Numéro matricule"), { target: { value: matricule } });
  fireEvent.click(screen.getByRole("button"));
}

// Le comportement volontairement discret (même message quel que soit le
// résultat, voir le commentaire dans ForgotPasswordForm.tsx) est justement
// ce qui mérite un test : ça évite une régression silencieuse qui laisserait
// deviner quels matricules existent.
describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset();
  });

  it("affiche le même message de confirmation que le matricule existe ou non (succès backend)", async () => {
    vi.mocked(apiPost).mockResolvedValue({ ok: true });
    render(<ForgotPasswordForm />);

    fillAndSubmit("ETF-2026-0001");

    await waitFor(() => {
      expect(screen.getByText("Vérifiez vos e-mails")).toBeInTheDocument();
    });
    expect(apiPost).toHaveBeenCalledWith("/auth/forgot-password", { matricule: "ETF-2026-0001" });
  });

  it("affiche le même message de confirmation même si l'appel backend échoue", async () => {
    vi.mocked(apiPost).mockRejectedValue(new Error("network down"));
    render(<ForgotPasswordForm />);

    fillAndSubmit("matricule-inexistant");

    await waitFor(() => {
      expect(screen.getByText("Vérifiez vos e-mails")).toBeInTheDocument();
    });
  });

  it("désactive le bouton et affiche 'Envoi...' pendant la requête", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    vi.mocked(apiPost).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    render(<ForgotPasswordForm />);

    fillAndSubmit("ETF-2026-0001");

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Envoi...");

    resolveRequest({ ok: true });
    await waitFor(() => expect(screen.getByText("Vérifiez vos e-mails")).toBeInTheDocument());
  });
});
