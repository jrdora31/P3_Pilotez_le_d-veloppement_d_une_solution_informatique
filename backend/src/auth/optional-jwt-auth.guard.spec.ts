import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { OptionalJwtAuthGuard } from "./optional-jwt-auth.guard";

describe("OptionalJwtAuthGuard", () => {
  let guard: OptionalJwtAuthGuard;

  beforeEach(() => {
    guard = new OptionalJwtAuthGuard();
  });

  it("autorise les requetes sans en-tete Authorization", async () => {
    const context = createExecutionContext(undefined);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("retourne l'utilisateur authentifie ou null", () => {
    const user = {
      id: "8f16a8a8-6046-43a2-85cc-dc639f6b7738",
      email: "claire.marie@datashare.fr"
    };

    expect(guard.handleRequest(null, user)).toEqual(user);
    expect(guard.handleRequest(null, false)).toBeNull();
  });

  it("propage les erreurs d'authentification", () => {
    const error = new Error("jwt expired");

    expect(() => guard.handleRequest(error, null)).toThrow(error);
    expect(() => guard.handleRequest("invalid token", null)).toThrow(UnauthorizedException);
  });

  function createExecutionContext(authorization: string | undefined): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization
          }
        })
      })
    } as unknown as ExecutionContext;
  }
});
