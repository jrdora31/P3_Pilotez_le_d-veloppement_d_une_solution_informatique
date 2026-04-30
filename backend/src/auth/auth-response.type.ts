import { PublicUser } from "../users/public-user.type";

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}
