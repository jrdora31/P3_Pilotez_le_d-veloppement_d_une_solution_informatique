import { fireEvent, render, screen } from "@testing-library/react";
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

  it("affiche le téléversement à la racine", () => {
    renderApp("/");

    expect(screen.getByRole("heading", { name: "Partager un fichier" })).toBeInTheDocument();
  });

  it("connecte l'utilisateur et affiche son espace", async () => {
    const viewer = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            accessToken: "signed.jwt.token",
            user
          })
        )
        .mockResolvedValueOnce(
          jsonResponse({
            items: []
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

  it("téléverse un fichier anonyme et affiche le lien", async () => {
    const viewer = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          file: {
            id: "4c7a2512-c0f1-40fa-827a-5ad6ddfcb475",
            ownerId: null,
            originalName: "contrat.pdf",
            size: 120000,
            mimeType: "application/pdf",
            tags: [],
            createdAt: "2026-01-01T10:00:00.000Z"
          },
          shareLink: {
            id: "cd5b2ea6-dde8-45c1-8cfd-4f62756ac520",
            token: "public-token",
            url: "http://localhost:5173/download/public-token",
            expiresAt: "2026-01-08T10:00:00.000Z",
            passwordProtected: false,
            createdAt: "2026-01-01T10:00:00.000Z"
          }
        })
      )
    );
    renderApp("/");

    fireEvent.change(screen.getByLabelText("Fichier"), {
      target: {
        files: [new File(["contenu"], "contrat.pdf", { type: "application/pdf" })]
      }
    });
    expect(screen.getAllByRole("option")).toHaveLength(7);
    expect(screen.getByRole("option", { name: "Deux jours" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Six jours" })).toBeInTheDocument();
    await viewer.click(screen.getByRole("button", { name: "Générer le lien" }));

    expect(await screen.findByText("Lien de partage")).toBeInTheDocument();
    expect(screen.getByText("http://localhost:5173/download/public-token")).toBeInTheDocument();
  });

  it("téléverse un fichier connecté avec tags et copie le lien", async () => {
    const viewer = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    saveAuth({
      accessToken: "signed.jwt.token",
      user
    });
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: {
        writeText
      }
    });
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        file: {
          id: "4c7a2512-c0f1-40fa-827a-5ad6ddfcb475",
          ownerId: user.id,
          originalName: "contrat.pdf",
          size: 120000,
          mimeType: "application/pdf",
          tags: ["finance", "projet"],
          createdAt: "2026-01-01T10:00:00.000Z"
        },
        shareLink: {
          id: "cd5b2ea6-dde8-45c1-8cfd-4f62756ac520",
          token: "public-token",
          url: "http://localhost:5173/download/public-token",
          expiresAt: "2026-01-08T10:00:00.000Z",
          passwordProtected: false,
          createdAt: "2026-01-01T10:00:00.000Z"
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/");

    fireEvent.change(screen.getByLabelText("Fichier"), {
      target: {
        files: [new File(["contenu"], "contrat.pdf", { type: "application/pdf" })]
      }
    });
    fireEvent.change(screen.getByLabelText("Expiration"), {
      target: {
        value: "5"
      }
    });
    await viewer.type(screen.getByLabelText("Tags"), "finance, projet");
    await viewer.click(screen.getByRole("button", { name: "Générer le lien" }));
    await viewer.click(await screen.findByRole("button", { name: "Copier" }));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.body as FormData).get("tags")).toBe(JSON.stringify(["finance", "projet"]));
    expect((init.body as FormData).get("expirationDays")).toBe("5");
    expect(writeText).toHaveBeenCalledWith("http://localhost:5173/download/public-token");
    expect(screen.getByText("Lien copié.")).toBeInTheDocument();
  });

  it("consulte un lien public et télécharge un fichier protégé", async () => {
    const viewer = userEvent.setup();
    const objectUrl = "blob:http://localhost/download";
    const createObjectURL = vi.fn().mockReturnValue(objectUrl);
    const revokeObjectURL = vi.fn();
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          fileName: "contrat.pdf",
          fileSize: 120000,
          message: null,
          expiresAt: "2026-01-08T10:00:00.000Z",
          passwordRequired: true,
          status: "active"
        })
      )
      .mockResolvedValueOnce(new Response(new Blob(["contenu"], { type: "application/pdf" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL
    });

    renderApp("/download/public-token");

    expect(await screen.findByRole("heading", { name: "contrat.pdf" })).toBeInTheDocument();
    await viewer.type(screen.getByLabelText("Mot de passe"), "secret1");
    await viewer.click(screen.getByRole("button", { name: "Télécharger" }));

    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:3000/share-links/public-token/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: "secret1"
      })
    });
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });

  it("affiche une erreur si le lien public est introuvable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            message: "Lien introuvable."
          },
          404
        )
      )
    );

    renderApp("/download/public-token");

    expect(await screen.findByText("Lien introuvable.")).toBeInTheDocument();
  });

  it("affiche une erreur si le téléchargement public échoue", async () => {
    const viewer = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            fileName: "contrat.pdf",
            fileSize: 120000,
            message: null,
            expiresAt: null,
            passwordRequired: false,
            status: "active"
          })
        )
        .mockResolvedValueOnce(
          jsonResponse(
            {
              message: "Mot de passe invalide."
            },
            401
          )
        )
    );

    renderApp("/download/public-token");

    expect(await screen.findByRole("heading", { name: "contrat.pdf" })).toBeInTheDocument();
    expect(screen.getByText("Aucune")).toBeInTheDocument();
    await viewer.click(screen.getByRole("button", { name: "Télécharger" }));

    expect(await screen.findByText("Mot de passe invalide.")).toBeInTheDocument();
  });

  it("affiche l'historique de l'utilisateur connecté", async () => {
    saveAuth({
      accessToken: "signed.jwt.token",
      user
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          items: [
            {
              id: "4c7a2512-c0f1-40fa-827a-5ad6ddfcb475",
              originalName: "contrat.pdf",
              size: 120000,
              mimeType: "application/pdf",
              tags: ["projet"],
              shareToken: "public-token",
              shareUrl: "http://localhost:5173/download/public-token",
              passwordProtected: false,
              expiresAt: "2026-01-08T10:00:00.000Z",
              status: "active",
              createdAt: "2026-01-01T10:00:00.000Z"
            },
            {
              id: "32b46b69-6328-47c2-b09c-6efa022c9d29",
              originalName: "secret.pdf",
              size: 120000,
              mimeType: "application/pdf",
              tags: [],
              shareToken: "secret-token",
              shareUrl: "http://localhost:5173/download/secret-token",
              passwordProtected: true,
              expiresAt: "2026-01-08T10:00:00.000Z",
              status: "active",
              createdAt: "2026-01-01T10:00:00.000Z"
            }
          ]
        })
      )
    );

    renderApp("/account");

    expect(await screen.findByText("contrat.pdf")).toBeInTheDocument();
    expect(screen.getByText("secret.pdf")).toBeInTheDocument();
    expect(screen.getByText("projet")).toBeInTheDocument();
    expect(screen.getAllByTitle("Lien protégé par mot de passe")).toHaveLength(1);
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          items: []
        })
      )
    );
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
