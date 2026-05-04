import { AuthController } from "./auth.controller";
import { AuthResponse } from "./auth-response.type";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let authController: AuthController;
  let authService: jest.Mocked<Pick<AuthService, "register" | "login">>;

  const publicUser = {
    id: "8f16a8a8-6046-43a2-85cc-dc639f6b7738",
    email: "claire.marie@datashare.fr",
    createdAt: new Date("2026-01-01T10:00:00.000Z"),
    updatedAt: new Date("2026-01-01T10:00:00.000Z")
  };

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn()
    };

    authController = new AuthController(authService as unknown as AuthService);
  });

  it("delegue la creation de compte au service auth", async () => {
    const payload = {
      email: "claire.marie@datashare.fr",
      password: "StrongPassword123!",
      passwordConfirmation: "StrongPassword123!"
    };
    authService.register.mockResolvedValue(publicUser);

    await expect(authController.register(payload)).resolves.toEqual(publicUser);
    expect(authService.register).toHaveBeenCalledWith(payload);
  });

  it("delegue la connexion au service auth", async () => {
    const payload = {
      email: "claire.marie@datashare.fr",
      password: "StrongPassword123!"
    };
    const authResponse: AuthResponse = {
      accessToken: "signed.jwt.token",
      user: publicUser
    };
    authService.login.mockResolvedValue(authResponse);

    await expect(authController.login(payload)).resolves.toEqual(authResponse);
    expect(authService.login).toHaveBeenCalledWith(payload);
  });
});
