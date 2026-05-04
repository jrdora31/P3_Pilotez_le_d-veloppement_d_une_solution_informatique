import { describe, expect, it, vi } from "vitest";
import { loginUser, registerUser } from "./api";

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
