import { describe, expect, it, vi } from "vitest";
import { deleteFile, downloadSharedFile, getShareLink, listOwnFiles, loginUser, registerUser, uploadFile } from "./api";

describe("api", () => {
  const user = {
    id: "8f16a8a8-6046-43a2-85cc-dc639f6b7738",
    email: "claire.marie@datashare.fr",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z"
  };

  it("envoie les donnees de creation de compte", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(user));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      registerUser({
        email: "claire.marie@datashare.fr",
        password: "StrongPassword123!",
        passwordConfirmation: "StrongPassword123!"
      })
    ).resolves.toEqual(user);

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "claire.marie@datashare.fr",
        password: "StrongPassword123!",
        passwordConfirmation: "StrongPassword123!"
      })
    });
  });

  it("retourne la session apres connexion", async () => {
    const auth = {
      accessToken: "signed.jwt.token",
      user
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(auth)));

    await expect(
      loginUser({
        email: "claire.marie@datashare.fr",
        password: "StrongPassword123!"
      })
    ).resolves.toEqual(auth);
  });

  it("téléverse un fichier avec les options de partage", async () => {
    const uploadResponse = {
      file: {
        id: "4c7a2512-c0f1-40fa-827a-5ad6ddfcb475",
        ownerId: user.id,
        originalName: "contrat.pdf",
        size: 120000,
        mimeType: "application/pdf",
        tags: ["projet"],
        createdAt: "2026-01-01T10:00:00.000Z"
      },
      shareLink: {
        id: "cd5b2ea6-dde8-45c1-8cfd-4f62756ac520",
        token: "public-token",
        url: "http://localhost:5173/download/public-token",
        expiresAt: "2026-01-08T10:00:00.000Z",
        passwordProtected: true,
        createdAt: "2026-01-01T10:00:00.000Z"
      }
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(uploadResponse, 201));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      uploadFile({
        file: new File(["contenu"], "contrat.pdf", { type: "application/pdf" }),
        accessToken: "signed.jwt.token",
        expirationDays: 3,
        sharePassword: "secret1",
        tags: ["projet"]
      })
    ).resolves.toEqual(uploadResponse);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3000/files");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: "Bearer signed.jwt.token"
    });
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("liste et supprime les fichiers de l'utilisateur", async () => {
    const listResponse = {
      items: [
        {
          id: "4c7a2512-c0f1-40fa-827a-5ad6ddfcb475",
          originalName: "contrat.pdf",
          size: 120000,
          mimeType: "application/pdf",
          tags: [],
          shareToken: "public-token",
          shareUrl: "http://localhost:5173/download/public-token",
          passwordProtected: false,
          expiresAt: "2026-01-08T10:00:00.000Z",
          status: "active",
          createdAt: "2026-01-01T10:00:00.000Z"
        }
      ]
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(listResponse))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listOwnFiles("signed.jwt.token")).resolves.toEqual(listResponse);
    await expect(deleteFile("4c7a2512-c0f1-40fa-827a-5ad6ddfcb475", "signed.jwt.token")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:3000/files?status=active", {
      headers: {
        Authorization: "Bearer signed.jwt.token"
      }
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:3000/files/4c7a2512-c0f1-40fa-827a-5ad6ddfcb475", {
      method: "DELETE",
      headers: {
        Authorization: "Bearer signed.jwt.token"
      }
    });
  });

  it("consulte et télécharge un lien public", async () => {
    const shareLink = {
      fileName: "contrat.pdf",
      fileSize: 120000,
      message: null,
      expiresAt: "2026-01-08T10:00:00.000Z",
      passwordRequired: true,
      status: "active"
    };
    const blob = new Blob(["contenu"], { type: "application/pdf" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(shareLink))
      .mockResolvedValueOnce(new Response(blob, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getShareLink("public-token")).resolves.toEqual(shareLink);
    await expect(downloadSharedFile("public-token", "secret1")).resolves.toEqual(blob);

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:3000/share-links/public-token", {
      headers: undefined
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:3000/share-links/public-token/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: "secret1"
      })
    });
  });

  it("remonte le message d'erreur fourni par l'API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            message: ["email must be an email", "password must be longer than or equal to 8 characters"]
          },
          400
        )
      )
    );

    await expect(
      loginUser({
        email: "bad-email",
        password: "short"
      })
    ).rejects.toThrow("email must be an email password must be longer than or equal to 8 characters");
  });

  it("utilise un message generique si la reponse d'erreur est illisible", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("{bad-json", {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        })
      )
    );

    await expect(
      loginUser({
        email: "claire.marie@datashare.fr",
        password: "StrongPassword123!"
      })
    ).rejects.toThrow("Une erreur est survenue.");
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
