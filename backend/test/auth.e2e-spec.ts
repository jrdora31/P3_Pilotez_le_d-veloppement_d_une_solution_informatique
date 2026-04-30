import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { hash } from "bcryptjs";
import request from "supertest";
import { AuthController } from "../src/auth/auth.controller";
import { AuthService } from "../src/auth/auth.service";
import { User } from "../src/users/user.entity";
import { UsersService } from "../src/users/users.service";

class InMemoryUsersService implements Pick<UsersService, "findByEmail" | "findByEmailWithPassword" | "create"> {
  private users = new Map<string, User>();

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(this.users.get(this.normalizeEmail(email)) ?? null);
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return Promise.resolve(this.users.get(this.normalizeEmail(email)) ?? null);
  }

  create(email: string, passwordHash: string): Promise<User> {
    const normalizedEmail = this.normalizeEmail(email);
    const now = new Date("2026-01-01T10:00:00.000Z");
    const user: User = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash,
      createdAt: now,
      updatedAt: now
    };

    this.users.set(normalizedEmail, user);
    return Promise.resolve(user);
  }

  async seed(email: string, password: string): Promise<void> {
    await this.create(email, await hash(password, 12));
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let usersService: InMemoryUsersService;

  beforeEach(async () => {
    usersService = new InMemoryUsersService();

    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: "test-secret",
          signOptions: {
            expiresIn: "1h"
          }
        })
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService
        }
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
      })
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("POST /auth/register retourne 201 et jamais passwordHash", async () => {
    const response = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "claire.marie@datashare.fr",
        password: "StrongPassword123!",
        passwordConfirmation: "StrongPassword123!"
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      email: "claire.marie@datashare.fr"
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it("POST /auth/login retourne un JWT et l'utilisateur", async () => {
    await usersService.seed("claire.marie@datashare.fr", "StrongPassword123!");

    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "claire.marie@datashare.fr",
        password: "StrongPassword123!"
      })
      .expect(200);

    expect(response.body).toMatchObject({
      accessToken: expect.any(String),
      user: {
        id: expect.any(String),
        email: "claire.marie@datashare.fr"
      }
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("retourne 400 si les donnees sont invalides", async () => {
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "not-an-email",
        password: "short",
        passwordConfirmation: "short"
      })
      .expect(400);
  });

  it("retourne 401 si les identifiants sont invalides", async () => {
    await usersService.seed("claire.marie@datashare.fr", "StrongPassword123!");

    await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "claire.marie@datashare.fr",
        password: "WrongPassword123!"
      })
      .expect(401);
  });

  it("retourne 409 si l'email est deja utilise", async () => {
    await usersService.seed("claire.marie@datashare.fr", "StrongPassword123!");

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "claire.marie@datashare.fr",
        password: "StrongPassword123!",
        passwordConfirmation: "StrongPassword123!"
      })
      .expect(409);
  });
});
