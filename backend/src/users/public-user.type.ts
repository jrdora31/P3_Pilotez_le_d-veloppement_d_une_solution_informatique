import { User } from "./user.entity";

export type PublicUser = Pick<User, "id" | "email" | "createdAt" | "updatedAt">;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
