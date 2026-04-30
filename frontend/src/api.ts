import { AuthResponse, LoginPayload, RegisterPayload, User } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function requestJson<TResponse, TPayload>(path: string, payload: TPayload): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<TResponse>;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    const message = body.message;

    if (Array.isArray(message)) {
      return message.join(" ");
    }

    if (message) {
      return message;
    }
  } catch {
    return "Une erreur est survenue.";
  }

  return "Une erreur est survenue.";
}

export function registerUser(payload: RegisterPayload): Promise<User> {
  return requestJson<User, RegisterPayload>("/auth/register", payload);
}

export function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return requestJson<AuthResponse, LoginPayload>("/auth/login", payload);
}
