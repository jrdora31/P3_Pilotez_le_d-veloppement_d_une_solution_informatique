import { createReadStream } from "node:fs";
import { randomBytes } from "node:crypto";
import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { compare, hash } from "bcryptjs";
import { LessThanOrEqual, Repository } from "typeorm";
import { User } from "../users/user.entity";
import { UploadFileDto } from "./dto/upload-file.dto";
import { FileRecord } from "./file-record.entity";
import {
  ExpirationPurgeResponse,
  FileDownload,
  FileListItem,
  FileSummary,
  ShareLinkCreated,
  ShareLinkPublic,
  UploadResponse
} from "./files-response.types";
import { FileStatusFilter } from "./dto/list-files-query.dto";
import { LocalFileStorageService } from "./local-file-storage.service";
import { ShareLink } from "./share-link.entity";
import { UploadedRequestFile } from "./uploaded-request-file.type";

const DEFAULT_EXPIRATION_DAYS = 7;
const MAX_TAGS = 20;

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileRecord)
    private readonly filesRepository: Repository<FileRecord>,
    @InjectRepository(ShareLink)
    private readonly shareLinksRepository: Repository<ShareLink>,
    private readonly storageService: LocalFileStorageService,
    private readonly configService: ConfigService
  ) {}

  async upload(
    uploadedFile: UploadedRequestFile | undefined,
    uploadDto: UploadFileDto,
    ownerId: string | null
  ): Promise<UploadResponse> {
    if (!uploadedFile) {
      throw new BadRequestException("Un fichier est requis.");
    }

    const tags = this.normalizeTags(uploadDto.tags ?? []);

    if (!ownerId && tags.length > 0) {
      throw new BadRequestException("Les tags sont reserves aux utilisateurs connectes.");
    }

    const password = uploadDto.sharePassword?.trim();
    const file = await this.filesRepository.save(
      this.filesRepository.create({
        owner: ownerId ? ({ id: ownerId } as User) : null,
        originalName: uploadedFile.originalname,
        storageName: uploadedFile.filename,
        mimeType: uploadedFile.mimetype || "application/octet-stream",
        size: uploadedFile.size,
        storagePath: uploadedFile.path,
        tags
      })
    );
    const shareLink = await this.createShareLink(file, uploadDto.expirationDays, password);

    return {
      file: this.toFileSummary(file, ownerId, tags),
      shareLink: this.toShareLinkCreated(shareLink)
    };
  }

  async listOwnFiles(ownerId: string, status: FileStatusFilter = "active"): Promise<FileListItem[]> {
    const files = await this.filesRepository
      .createQueryBuilder("file")
      .leftJoinAndSelect("file.shareLinks", "shareLink")
      .addSelect("shareLink.passwordHash")
      .where("file.owner_id = :ownerId", { ownerId })
      .orderBy("file.createdAt", "DESC")
      .addOrderBy("shareLink.createdAt", "DESC")
      .getMany();

    return files
      .map((file) => this.toFileListItem(file))
      .filter((file) => status === "all" || file.status === status);
  }

  async deleteOwnFile(fileId: string, ownerId: string): Promise<void> {
    const file = await this.filesRepository
      .createQueryBuilder("file")
      .leftJoinAndSelect("file.shareLinks", "shareLink")
      .where("file.id = :fileId", { fileId })
      .andWhere("file.owner_id = :ownerId", { ownerId })
      .getOne();

    if (!file) {
      throw new NotFoundException("Fichier introuvable.");
    }

    await this.storageService.deleteFile(file.storagePath);
    await this.filesRepository.remove(file);
  }

  async getPublicShareLink(token: string): Promise<ShareLinkPublic> {
    const shareLink = await this.findShareLinkWithFile(token);

    if (!shareLink) {
      throw new NotFoundException("Lien de partage introuvable.");
    }

    if (this.isExpired(shareLink)) {
      throw new GoneException("Ce lien a expire.");
    }

    return {
      fileName: shareLink.file.originalName,
      fileSize: shareLink.file.size,
      message: null,
      expiresAt: shareLink.expiresAt,
      passwordRequired: Boolean(shareLink.passwordHash),
      status: "active"
    };
  }

  async downloadSharedFile(token: string, password?: string): Promise<FileDownload> {
    const shareLink = await this.findShareLinkWithFileAndPassword(token);

    if (!shareLink) {
      throw new NotFoundException("Lien de partage introuvable.");
    }

    if (this.isExpired(shareLink)) {
      throw new GoneException("Ce lien a expire.");
    }

    if (shareLink.passwordHash) {
      const passwordIsValid = password ? await compare(password, shareLink.passwordHash) : false;

      if (!passwordIsValid) {
        throw new UnauthorizedException("Mot de passe incorrect.");
      }
    }

    return {
      stream: createReadStream(shareLink.file.storagePath),
      fileName: shareLink.file.originalName,
      mimeType: shareLink.file.mimeType,
      size: shareLink.file.size
    };
  }

  async purgeExpiredFiles(): Promise<ExpirationPurgeResponse> {
    const startedAt = new Date();
    const expiredLinks = await this.shareLinksRepository.find({
      where: {
        expiresAt: LessThanOrEqual(startedAt)
      },
      relations: {
        file: true
      }
    });
    const filesById = new Map<string, FileRecord>();

    for (const shareLink of expiredLinks) {
      filesById.set(shareLink.file.id, shareLink.file);
    }

    let purgedBytes = 0;

    for (const file of filesById.values()) {
      purgedBytes += file.size;
      await this.storageService.deleteFile(file.storagePath);
    }

    if (filesById.size > 0) {
      await this.filesRepository.remove([...filesById.values()]);
    }

    return {
      purgedFiles: filesById.size,
      purgedShareLinks: expiredLinks.length,
      purgedBytes,
      startedAt,
      finishedAt: new Date()
    };
  }

  private async createShareLink(
    file: FileRecord,
    expirationDays: number | undefined,
    password: string | undefined
  ): Promise<ShareLink> {
    const shareLink = this.shareLinksRepository.create({
      file,
      token: await this.generateUniqueToken(),
      passwordHash: password ? await hash(password, 12) : null,
      expiresAt: this.resolveExpiresAt(expirationDays)
    });

    return this.shareLinksRepository.save(shareLink);
  }

  private async generateUniqueToken(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const token = randomBytes(18).toString("base64url");
      const existingShareLink = await this.shareLinksRepository.findOne({
        where: {
          token
        }
      });

      if (!existingShareLink) {
        return token;
      }
    }

    throw new BadRequestException("Impossible de generer un lien de partage.");
  }

  private resolveExpiresAt(expirationDays: number | undefined): Date {
    const days = expirationDays ?? DEFAULT_EXPIRATION_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }

  private async findShareLinkWithFile(token: string): Promise<ShareLink | null> {
    return this.shareLinksRepository
      .createQueryBuilder("shareLink")
      .addSelect("shareLink.passwordHash")
      .leftJoinAndSelect("shareLink.file", "file")
      .where("shareLink.token = :token", { token })
      .getOne();
  }

  private async findShareLinkWithFileAndPassword(token: string): Promise<ShareLink | null> {
    return this.shareLinksRepository
      .createQueryBuilder("shareLink")
      .addSelect("shareLink.passwordHash")
      .leftJoinAndSelect("shareLink.file", "file")
      .where("shareLink.token = :token", { token })
      .getOne();
  }

  private toFileSummary(file: FileRecord, ownerId: string | null, tags: string[]): FileSummary {
    return {
      id: file.id,
      ownerId,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      tags,
      createdAt: file.createdAt
    };
  }

  private toShareLinkCreated(shareLink: ShareLink): ShareLinkCreated {
    return {
      id: shareLink.id,
      token: shareLink.token,
      url: this.buildShareUrl(shareLink.token),
      expiresAt: shareLink.expiresAt,
      passwordProtected: Boolean(shareLink.passwordHash),
      createdAt: shareLink.createdAt
    };
  }

  private toFileListItem(file: FileRecord): FileListItem {
    const shareLink = this.getMainShareLink(file);

    return {
      id: file.id,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      tags: file.tags ?? [],
      shareToken: shareLink?.token ?? null,
      shareUrl: shareLink ? this.buildShareUrl(shareLink.token) : null,
      passwordProtected: Boolean(shareLink?.passwordHash),
      expiresAt: shareLink?.expiresAt ?? null,
      status: shareLink && this.isExpired(shareLink) ? "expired" : "active",
      createdAt: file.createdAt
    };
  }

  private getMainShareLink(file: FileRecord): ShareLink | null {
    return [...(file.shareLinks ?? [])].sort(
      (first, second) => second.createdAt.getTime() - first.createdAt.getTime()
    )[0] ?? null;
  }

  private buildShareUrl(token: string): string {
    return `${this.getFrontendPublicUrl()}/download/${token}`;
  }

  private getFrontendPublicUrl(): string {
    const configuredPublicUrl = this.configService.get<string>("FRONTEND_PUBLIC_URL")?.trim();

    if (configuredPublicUrl) {
      return configuredPublicUrl.replace(/\/$/, "");
    }

    const firstAllowedOrigin = this.configService
      .get<string>("FRONTEND_ORIGIN", "http://localhost:5173")
      .split(/[,\s]+/)
      .map((origin) => origin.trim())
      .filter(Boolean)[0];

    return (firstAllowedOrigin ?? "http://localhost:5173").replace(/\/$/, "");
  }

  private isExpired(shareLink: Pick<ShareLink, "expiresAt">): boolean {
    return Boolean(shareLink.expiresAt && shareLink.expiresAt.getTime() <= Date.now());
  }

  private normalizeTags(tags: string[]): string[] {
    const uniqueTags = new Map<string, string>();

    for (const tag of tags) {
      const normalizedTag = tag.trim();

      if (normalizedTag) {
        uniqueTags.set(normalizedTag.toLowerCase(), normalizedTag);
      }
    }

    if (uniqueTags.size > MAX_TAGS) {
      throw new BadRequestException("Un fichier ne peut pas avoir plus de 20 tags.");
    }

    return [...uniqueTags.values()];
  }
}
