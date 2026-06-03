import { ReadStream } from "node:fs";

export interface FileSummary {
  id: string;
  ownerId: string | null;
  originalName: string;
  size: number;
  mimeType: string;
  tags: string[];
  createdAt: Date;
}

export interface ShareLinkCreated {
  id: string;
  token: string;
  url: string;
  expiresAt: Date | null;
  passwordProtected: boolean;
  createdAt: Date;
}

export interface UploadResponse {
  file: FileSummary;
  shareLink: ShareLinkCreated;
}

export interface FileListItem {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  tags: string[];
  shareToken: string | null;
  shareUrl: string | null;
  passwordProtected: boolean;
  expiresAt: Date | null;
  status: "active" | "expired";
  createdAt: Date;
}

export interface ShareLinkPublic {
  fileName: string;
  fileSize: number;
  message: string | null;
  expiresAt: Date | null;
  passwordRequired: boolean;
  status: "active" | "expired";
}

export interface FileDownload {
  stream: ReadStream;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface ExpirationPurgeResponse {
  purgedFiles: number;
  purgedShareLinks: number;
  purgedBytes: number;
  startedAt: Date;
  finishedAt: Date;
}
