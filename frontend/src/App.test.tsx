import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { saveAuth } from "./auth-storage";

describe("App", () => {
  const user = {
    id: "8f16a8a8-6046-43a2-85cc-dc639f6b7738",
    email: "claire.marie@datashare.fr",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z"
  };

  it("redirige la racine vers la page de connexion", () => {
    renderApp("/");

    expect(screen.getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
  });

  it("connecte l'utilisateur et affiche son espace", async () => {
    const viewer = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          accessToken: "signed.jwt.token",
          user
        })
      )
    );
    renderApp("/login");

    await viewer.type(screen.getByLabelText("Email"), "claire.marie@datashare.fr");
    await viewer.type(screen.getByLabelText("Mot de passe"), "StrongPassword123!");
    await viewer.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("heading", { name: "Connecté" })).toBeInTheDocument();
    expect(screen.getByText("claire.marie@datashare.fr")).toBeInTheDocument();
  });

  it("affiche une erreur si la connexion echoue", async () => {
    const viewer = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            message: "Identifiants invalides."
          },
          401
        )
      )
    );
    renderApp("/login");

    await viewer.type(screen.getByLabelText("Email"), "claire.marie@datashare.fr");
    await viewer.type(screen.getByLabelText("Mot de passe"), "WrongPassword123!");
    await viewer.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText("Identifiants invalides.")).toBeInTheDocument();
  });

  it("bloque la creation de compte si les mots de passe different", async () => {
    const viewer = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/register");

    await viewer.type(screen.getByLabelText("Email"), "claire.marie@datashare.fr");
    await viewer.type(screen.getByLabelText("Mot de passe"), "StrongPassword123!");
    await viewer.type(screen.getByLabelText("Confirmation"), "DifferentPassword123!");
    await viewer.click(screen.getByRole("button", { name: "Créer le compte" }));

    expect(await screen.findByText("Les mots de passe ne correspondent pas.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirige vers la connexion apres creation de compte", async () => {
    const viewer = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(user, 201)));
    renderApp("/register");

    await viewer.type(screen.getByLabelText("Email"), "claire.marie@datashare.fr");
    await viewer.type(screen.getByLabelText("Mot de passe"), "StrongPassword123!");
    await viewer.type(screen.getByLabelText("Confirmation"), "StrongPassword123!");
    await viewer.click(screen.getByRole("button", { name: "Créer le compte" }));

    expect(await screen.findByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(screen.getByText("Compte créé. Vous pouvez maintenant vous connecter.")).toBeInTheDocument();
  });

  it("redirige l'espace compte sans session", () => {
    renderApp("/account");

    expect(screen.getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
  });

  it("deconnecte l'utilisateur courant", async () => {
    const viewer = userEvent.setup();
    saveAuth({
      accessToken: "signed.jwt.token",
      user
    });
    renderApp("/account");

    await viewer.click(screen.getByRole("button", { name: "Déconnexion" }));

    expect(await screen.findByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(localStorage.getItem("datashare.accessToken")).toBeNull();
  });
});

function renderApp(initialRoute: string): void {
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  );
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
