import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "./LoginForm";
import { apiPost, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY, ACCOUNT_ROLE_KEY } from "@/lib/accountSession";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, apiPost: vi.fn() };
});

function fillAndSubmit(matricule: string, password: string) {
  fireEvent.change(screen.getByLabelText("Numéro matricule"), { target: { value: matricule } });
  fireEvent.change(screen.getByLabelText("Mot de passe / code"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /Se connecter|Connexion/ }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset();
    push.mockReset();
    sessionStorage.clear();
  });

  it("stocke le rôle/matricule et redirige vers la route connue pour ce rôle en cas de succès", async () => {
    vi.mocked(apiPost).mockResolvedValue({ ok: true, role: "formateur" });
    render(<LoginForm />);

    fillAndSubmit("ETF-2026-0001", "Sup3rSecret!");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/compte/formateur"));
    expect(apiPost).toHaveBeenCalledWith("/auth/login", {
      matricule: "ETF-2026-0001",
      password: "Sup3rSecret!",
    });
    expect(sessionStorage.getItem(ACCOUNT_ROLE_KEY)).toBe("formateur");
    expect(sessionStorage.getItem(ACCOUNT_MATRICULE_KEY)).toBe("ETF-2026-0001");
  });

  it("redirige vers '/' si le rôle renvoyé par le backend n'est pas dans ROLE_ROUTES", async () => {
    vi.mocked(apiPost).mockResolvedValue({ ok: true, role: "role-inconnu" });
    render(<LoginForm />);

    fillAndSubmit("ETF-2026-0001", "Sup3rSecret!");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("affiche un message générique 'matricule ou mot de passe invalide' sur une ApiError (401)", async () => {
    vi.mocked(apiPost).mockRejectedValue(new ApiError("Unauthorized", 401));
    render(<LoginForm />);

    fillAndSubmit("ETF-2026-0001", "mauvais-mdp");

    await waitFor(() => {
      expect(screen.getByText("Matricule ou mot de passe invalide.")).toBeInTheDocument();
    });
    expect(push).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(ACCOUNT_ROLE_KEY)).toBeNull();
  });

  it("affiche un message générique réseau sur une erreur qui n'est pas une ApiError", async () => {
    vi.mocked(apiPost).mockRejectedValue(new Error("fetch failed"));
    render(<LoginForm />);

    fillAndSubmit("ETF-2026-0001", "Sup3rSecret!");

    await waitFor(() => {
      expect(
        screen.getByText("Une erreur est survenue. Merci de réessayer plus tard.")
      ).toBeInTheDocument();
    });
  });

  it("désactive le bouton et affiche 'Connexion...' pendant la requête", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    vi.mocked(apiPost).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    render(<LoginForm />);

    fillAndSubmit("ETF-2026-0001", "Sup3rSecret!");

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Connexion...");

    resolveRequest({ ok: true, role: "apprenant" });
    await waitFor(() => expect(push).toHaveBeenCalled());
  });
});
