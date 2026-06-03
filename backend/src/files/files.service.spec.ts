import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { FileRecord } from "./file-record.entity";
import { FilesService } from "./files.service";
import { LocalFileStorageService } from "./local-file-storage.service";
import { ShareLink } from "./share-link.entity";

type MockRepository = Record<string, jest.Mock>;

describe("FilesService", () => {
  let service: FilesService;
  let filesRepository: MockRepository;
  let shareLinksRepository: MockRepository;
  let storageService: jest.Mocked<Pick<LocalFileStorageService, "deleteFile">>;

  const now = new Date("2026-01-01T10:00:00.000Z");
  const future = new Date("2027-01-08T10:00:00.000Z");
  const past = new Date("2025-12-31T10:00:00.000Z");

  beforeEach(() => {
    filesRepository = {
      create: jest.fn((value) => value as FileRecord),
      find: jest.fn(),
      remove: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn()
    };
    shareLinksRepository = {
      create: jest.fn((value) => ({
        id: "cd5b2ea6-dde8-45c1-8cfd-4f62756ac520",
        createdAt: now,
        ...value
      }) as ShareLink),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn()
    };
    storageService = {
      deleteFile: jest.fn()
    };

    service = new FilesService(
      filesRepository as unknown as Repository<FileRecord>,
      shareLinksRepository as unknown as Repository<ShareLink>,
      storageService as unknown as LocalFileStorageService,
      {
        get: jest.fn((_key: string, defaultValue: string) => defaultValue)
      } as unknown as ConfigService
    );
  });

  it("téléverse un fichier connecté avec tags, expiration et mot de passe", async () => {
    const savedFile = createFile({
      tags: ["Projet"],
      ownerId: "8f16a8a8-6046-43a2-85cc-dc639f6b7738"
    });
    filesRepository.save.mockResolvedValue(savedFile);
    shareLinksRepository.findOne.mockResolvedValue(null);
    shareLinksRepository.save.mockImplementation(async (shareLink) => shareLink as ShareLink);

    const response = await service.upload(
      {
        originalname: "contrat.pdf",
        filename: "storage-name.pdf",
        mimetype: "application/pdf",
        size: 120000,
        path: "uploads/storage-name.pdf"
      },
      {
        expirationDays: 3,
        sharePassword: "secret1",
        tags: ["Projet", "projet"]
      },
      "8f16a8a8-6046-43a2-85cc-dc639f6b7738"
    );

    expect(filesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        originalName: "contrat.pdf",
        tags: ["projet"]
      })
    );
    expect(response.file.ownerId).toBe("8f16a8a8-6046-43a2-85cc-dc639f6b7738");
    expect(response.file.tags).toEqual(["projet"]);
    expect(response.shareLink.passwordProtected).toBe(true);
    expect(response.shareLink.url).toContain("/download/");
  });

  it("génère le lien de partage avec une seule URL publique même si le CORS a plusieurs origines", async () => {
    service = new FilesService(
      filesRepository as unknown as Repository<FileRecord>,
      shareLinksRepository as unknown as Repository<ShareLink>,
      storageService as unknown as LocalFileStorageService,
      {
        get: jest.fn((key: string, defaultValue?: string) => {
          if (key === "FRONTEND_ORIGIN") {
            return "http://localhost:5173,http://127.0.0.1:5173";
          }

          return defaultValue;
        })
      } as unknown as ConfigService
    );
    const savedFile = createFile();
    filesRepository.save.mockResolvedValue(savedFile);
    shareLinksRepository.findOne.mockResolvedValue(null);
    shareLinksRepository.save.mockImplementation(async (shareLink) => shareLink as ShareLink);

    const response = await service.upload(
      {
        originalname: "contrat.pdf",
        filename: "storage-name.pdf",
        mimetype: "application/pdf",
        size: 120000,
        path: "uploads/storage-name.pdf"
      },
      {},
      null
    );

    expect(response.shareLink.url).toBe(`http://localhost:5173/download/${response.shareLink.token}`);
  });

  it("refuse les tags pour un upload anonyme", async () => {
    await expect(
      service.upload(
        {
          originalname: "contrat.pdf",
          filename: "storage-name.pdf",
          mimetype: "application/pdf",
          size: 120000,
          path: "uploads/storage-name.pdf"
        },
        {
          tags: ["projet"]
        },
        null
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("liste uniquement les fichiers actifs par défaut", async () => {
    const queryBuilder = createFilesQueryBuilderMock([
      createFile({
        id: "active-file",
        shareLinks: [
          createShareLink({
            expiresAt: future,
            passwordHash: "$2a$12$hashed-password"
          })
        ]
      }),
      createFile({
        id: "expired-file",
        shareLinks: [createShareLink({ expiresAt: past })]
      })
    ]);
    filesRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const response = await service.listOwnFiles("8f16a8a8-6046-43a2-85cc-dc639f6b7738");

    expect(response).toHaveLength(1);
    expect(response[0]).toMatchObject({
      id: "active-file",
      passwordProtected: true
    });
    expect(queryBuilder.addSelect).toHaveBeenCalledWith("shareLink.passwordHash");
  });

  it("indique si un lien public est protégé par mot de passe", async () => {
    shareLinksRepository.createQueryBuilder.mockReturnValue(
      createQueryBuilderMock(
        createShareLink({
          passwordHash: "$2a$12$hashed-password"
        })
      )
    );

    const response = await service.getPublicShareLink("public-token");

    expect(response).toMatchObject({
      fileName: "contrat.pdf",
      passwordRequired: true,
      status: "active"
    });
  });

  it("purge les fichiers expirés et leurs fichiers physiques", async () => {
    const expiredFile = createFile({
      id: "expired-file",
      size: 300,
      storagePath: "uploads/expired-file.pdf"
    });
    shareLinksRepository.find.mockResolvedValue([
      createShareLink({
        file: expiredFile,
        expiresAt: past
      })
    ]);
    filesRepository.remove.mockResolvedValue(expiredFile);

    const response = await service.purgeExpiredFiles();

    expect(storageService.deleteFile).toHaveBeenCalledWith("uploads/expired-file.pdf");
    expect(filesRepository.remove).toHaveBeenCalledWith([expiredFile]);
    expect(response).toMatchObject({
      purgedFiles: 1,
      purgedShareLinks: 1,
      purgedBytes: 300
    });
  });

  function createFile(overrides: Partial<FileRecord> = {}): FileRecord {
    return {
      id: "4c7a2512-c0f1-40fa-827a-5ad6ddfcb475",
      owner: null,
      ownerId: null,
      originalName: "contrat.pdf",
      storageName: "storage-name.pdf",
      mimeType: "application/pdf",
      size: 120000,
      storagePath: "uploads/storage-name.pdf",
      tags: [],
      createdAt: now,
      shareLinks: [],
      ...overrides
    };
  }

  function createShareLink(overrides: Partial<ShareLink> = {}): ShareLink {
    return {
      id: "cd5b2ea6-dde8-45c1-8cfd-4f62756ac520",
      file: createFile(),
      token: "public-token",
      passwordHash: null,
      expiresAt: future,
      createdAt: now,
      ...overrides
    };
  }

  function createQueryBuilderMock(result: ShareLink | null) {
    return {
      addSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(result)
    };
  }

  function createFilesQueryBuilderMock(result: FileRecord[]) {
    return {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(result)
    };
  }
});
