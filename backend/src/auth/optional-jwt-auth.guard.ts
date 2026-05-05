import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedUser } from "./authenticated-user.type";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();

    if (!request.headers.authorization) {
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }

  override handleRequest<TUser = AuthenticatedUser>(
    error: unknown,
    user: TUser | false | null
  ): TUser | null {
    if (error) {
      throw error instanceof Error ? error : new UnauthorizedException("Token invalide.");
    }

    return user || null;
  }
}
