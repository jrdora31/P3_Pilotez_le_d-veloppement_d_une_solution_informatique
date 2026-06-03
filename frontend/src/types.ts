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

export interface UploadFilePayload {
  file: File;
  sharePassword?: string;
  expirationDays?: number;
  tags?: string[];
  accessToken?: string | null;
}

export interface FileSummary {
  id: string;
  ownerId: string | null;
  originalName: string;
  size: number;
  mimeType: string;
  tags: string[];
  createdAt: string;
}

export interface ShareLinkCreated {
  id: string;
  token: string;
  url: string;
  expiresAt: string | null;
  passwordProtected: boolean;
  createdAt: string;
}

export interface UploadResponse {
  file: FileSummary;
  shareLink: ShareLinkCreated;
}

export type FileStatus = "active" | "expired";
export type FileStatusFilter = "active" | "expired" | "all";

export interface FileListItem {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  tags: string[];
  shareToken: string | null;
  shareUrl: string | null;
  passwordProtected: boolean;
  expiresAt: string | null;
  status: FileStatus;
  createdAt: string;
}

export interface ShareLinkPublic {
  fileName: string;
  fileSize: number;
  message: string | null;
  expiresAt: string | null;
  passwordRequired: boolean;
  status: FileStatus;
}
