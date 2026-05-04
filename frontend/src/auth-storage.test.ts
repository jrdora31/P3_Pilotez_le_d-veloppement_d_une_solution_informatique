import { describe, expect, it } from "vitest";
import { clearAuth, getAccessToken, getCurrentUser, saveAuth } from "./auth-storage";

describe("auth-storage", () => {
  const auth = {
    accessToken: "signed.jwt.token",
    user: {
      id: "8f16a8a8-6046-43a2-85cc-dc639f6b7738",
      email: "claire.marie@datashare.fr",
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z"
    }
  };

  it("sauvegarde et relit la session courante", () => {
    saveAuth(auth);

    expect(getAccessToken()).toBe("signed.jwt.token");
    expect(getCurrentUser()).toEqual(auth.user);
  });

  it("supprime la session courante", () => {
    saveAuth(auth);

    clearAuth();

    expect(getAccessToken()).toBeNull();
    expect(getCurrentUser()).toBeNull();
  });

  it("nettoie une session illisible", () => {
    localStorage.setItem("datashare.accessToken", "signed.jwt.token");
    localStorage.setItem("datashare.user", "{bad-json");

    expect(getCurrentUser()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});
