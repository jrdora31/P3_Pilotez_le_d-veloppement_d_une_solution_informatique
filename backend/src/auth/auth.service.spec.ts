import { BadRequestException, ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash } from "bcryptjs";
import { User } from "../users/user.entity";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, "findByEmail" | "findByEmailWithPassword" | "create">>;

  const baseUser: User = {
    id: "8f16a8a8-6046-43a2-85cc-dc639f6b7738",
    email: "claire.marie@datashare.fr",
    passwordHash: "$2a$12$placeholder",
    createdAt: new Date("2026-01-01T10:00:00.000Z"),
    updatedAt: new Date("2026-01-01T10:00:00.000Z")
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      create: jest.fn()
    };

    authService = new AuthService(
      usersService as unknown as UsersService,
      new JwtService({
        secret: "test-secret",
        signOptions: {
          expiresIn: "1h"
        }
      })
    );
  });

  it("cree un compte valide sans exposer le hash", async () => {
    let savedHash = "";
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockImplementation(async (email, passwordHash) => {
      savedHash = passwordHash;
      return {
        ...baseUser,
        email,
        passwordHash
      };
    });

    const user = await authService.register({
      email: "claire.marie@datashare.fr",
      password: "StrongPassword123!",
      passwordConfirmation: "StrongPassword123!"
    });

    expect(user).toEqual({
      id: baseUser.id,
      email: "claire.marie@datashare.fr",
      createdAt: baseUser.createdAt,
      updatedAt: baseUser.updatedAt
    });
    expect(savedHash).not.toBe("StrongPassword123!");
    expect(savedHash).toMatch(/^\$2[aby]\$/);
  });

  it("refuse un email deja utilise", async () => {
    usersService.findByEmail.mockResolvedValue(baseUser);

    await expect(
      authService.register({
        email: "claire.marie@datashare.fr",
        password: "StrongPassword123!",
        passwordConfirmation: "StrongPassword123!"
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("refuse un mot de passe trop court", async () => {
    await expect(
      authService.register({
        email: "claire.marie@datashare.fr",
        password: "short",
        passwordConfirmation: "short"
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("refuse une confirmation de mot de passe differente", async () => {
    await expect(
      authService.register({
        email: "claire.marie@datashare.fr",
        password: "StrongPassword123!",
        passwordConfirmation: "DifferentPassword123!"
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("connecte un utilisateur avec des identifiants valides", async () => {
    const passwordHash = await hash("StrongPassword123!", 12);
    usersService.findByEmailWithPassword.mockResolvedValue({
      ...baseUser,
      passwordHash
    });

    const response = await authService.login({
      email: "claire.marie@datashare.fr",
      password: "StrongPassword123!"
    });

    expect(response.accessToken).toEqual(expect.any(String));
    expect(response.user).toEqual({
      id: baseUser.id,
      email: baseUser.email,
      createdAt: baseUser.createdAt,
      updatedAt: baseUser.updatedAt
    });
  });

  it("refuse une connexion avec un mauvais mot de passe", async () => {
    const passwordHash = await hash("StrongPassword123!", 12);
    usersService.findByEmailWithPassword.mockResolvedValue({
      ...baseUser,
      passwordHash
    });

    await expect(
      authService.login({
        email: "claire.marie@datashare.fr",
        password: "WrongPassword123!"
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("refuse une connexion pour un utilisateur inconnu", async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);

    await expect(
      authService.login({
        email: "missing@datashare.fr",
        password: "StrongPassword123!"
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
