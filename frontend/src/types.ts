export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
