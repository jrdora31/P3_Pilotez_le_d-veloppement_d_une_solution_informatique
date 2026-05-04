import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { LoginDto } from "./login.dto";
import { RegisterDto } from "./register.dto";

describe("Auth DTOs", () => {
  it("normalise l'email de connexion", async () => {
    const dto = plainToInstance(LoginDto, {
      email: " Claire.Marie@DataShare.FR ",
      password: "StrongPassword123!"
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.email).toBe("claire.marie@datashare.fr");
  });

  it("valide les donnees requises pour la creation de compte", async () => {
    const dto = plainToInstance(RegisterDto, {
      email: "not-an-email",
      password: "short",
      passwordConfirmation: "short"
    });

    const errors = await validate(dto);
    const invalidProperties = errors.map((error) => error.property);

    expect(invalidProperties).toEqual(expect.arrayContaining(["email", "password", "passwordConfirmation"]));
  });

  it("ne transforme pas les emails non textuels", async () => {
    const loginDto = plainToInstance(LoginDto, {
      email: null,
      password: "StrongPassword123!"
    });
    const registerDto = plainToInstance(RegisterDto, {
      email: null,
      password: "StrongPassword123!",
      passwordConfirmation: "StrongPassword123!"
    });

    expect(loginDto.email).toBeNull();
    expect(registerDto.email).toBeNull();
  });
});
