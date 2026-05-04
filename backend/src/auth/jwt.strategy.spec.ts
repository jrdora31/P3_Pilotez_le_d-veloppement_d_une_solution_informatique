import { ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";

describe("JwtStrategy", () => {
  it("expose l'utilisateur public depuis le payload JWT", () => {
    const configService = {
      get: jest.fn().mockReturnValue("test-secret")
    };
    const strategy = new JwtStrategy(configService as unknown as ConfigService);

    expect(configService.get).toHaveBeenCalledWith("JWT_SECRET", "development-secret");
    expect(
      strategy.validate({
        sub: "8f16a8a8-6046-43a2-85cc-dc639f6b7738",
        email: "claire.marie@datashare.fr"
      })
    ).toEqual({
      id: "8f16a8a8-6046-43a2-85cc-dc639f6b7738",
      email: "claire.marie@datashare.fr"
    });
  });
});
