import {
  AuthResponse,
  FileListItem,
  FileStatusFilter,
  LoginPayload,
  RegisterPayload,
  ShareLinkPublic,
  UploadFilePayload,
  UploadResponse,
  User
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function postJson<TResponse, TPayload>(path: string, payload: TPayload): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

async function requestJson<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: init?.headers
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
  return postJson<User, RegisterPayload>("/auth/register", payload);
}

export function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return postJson<AuthResponse, LoginPayload>("/auth/login", payload);
}

export async function uploadFile(payload: UploadFilePayload): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", payload.file);

  if (payload.sharePassword) {
    formData.append("sharePassword", payload.sharePassword);
  }

  if (payload.expirationDays) {
    formData.append("expirationDays", String(payload.expirationDays));
  }

  if (payload.tags?.length) {
    formData.append("tags", JSON.stringify(payload.tags));
  }

  const headers = payload.accessToken
    ? {
        Authorization: `Bearer ${payload.accessToken}`
      }
    : undefined;

  return requestJson<UploadResponse>("/files", {
    method: "POST",
    headers,
    body: formData
  });
}

export function listOwnFiles(accessToken: string, status: FileStatusFilter = "active"): Promise<{ items: FileListItem[] }> {
  return requestJson<{ items: FileListItem[] }>(`/files?status=${status}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export async function deleteFile(fileId: string, accessToken: string): Promise<void> {
  const response = await fetch(`${API_URL}/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

export function getShareLink(token: string): Promise<ShareLinkPublic> {
  return requestJson<ShareLinkPublic>(`/share-links/${token}`);
}

export async function downloadSharedFile(token: string, password?: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/share-links/${token}/download`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(password ? { password } : {})
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.blob();
}
