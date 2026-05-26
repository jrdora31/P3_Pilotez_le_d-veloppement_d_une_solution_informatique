import { mkdirSync, rmSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import { FileRecord } from "../src/files/file-record.entity";
import { FilesController } from "../src/files/files.controller";
import { FilesService } from "../src/files/files.service";
import { LocalFileStorageService } from "../src/files/local-file-storage.service";
import { ShareLink } from "../src/files/share-link.entity";
import { ShareLinksController } from "../src/files/share-links.controller";

class InMemoryFilesRepository {
  private files = new Map<string, FileRecord>();

  create(value: Partial<FileRecord>): FileRecord {
    return value as FileRecord;
  }

  save(value: Partial<FileRecord>): Promise<FileRecord> {
    const file = {
      id: value.id ?? randomUUID(),
      owner: value.owner ?? null,
      ownerId: value.owner?.id ?? null,
      originalName: value.originalName ?? "",
      storageName: value.storageName ?? "",
      mimeType: value.mimeType ?? "application/octet-stream",
      size: value.size ?? 0,
      storagePath: value.storagePath ?? "",
      tags: value.tags ?? [],
      createdAt: value.createdAt ?? new Date(),
      shareLinks: value.shareLinks ?? []
    } as FileRecord;

    this.files.set(file.id, file);
    return Promise.resolve(file);
  }
}

class InMemoryShareLinksRepository {
  private shareLinks = new Map<string, ShareLink>();

  create(value: Partial<ShareLink>): ShareLink {
    return value as ShareLink;
  }

  findOne(options: { where?: { token?: string } }): Promise<ShareLink | null> {
    const token = options.where?.token;
    return Promise.resolve(token ? this.shareLinks.get(token) ?? null : null);
  }

  save(value: Partial<ShareLink>): Promise<ShareLink> {
    const shareLink = {
      id: value.id ?? randomUUID(),
      file: value.file,
      token: value.token ?? randomUUID(),
      passwordHash: value.passwordHash ?? null,
      expiresAt: value.expiresAt ?? null,
      createdAt: value.createdAt ?? new Date()
    } as ShareLink;

    shareLink.file.shareLinks = [...(shareLink.file.shareLinks ?? []), shareLink];
    this.shareLinks.set(shareLink.token, shareLink);
    return Promise.resolve(shareLink);
  }

  createQueryBuilder() {
    let selectedToken: string | null = null;
    const queryBuilder = {
      addSelect: () => queryBuilder,
      leftJoinAndSelect: () => queryBuilder,
      where: (_condition: string, parameters: { token: string }) => {
        selectedToken = parameters.token;
        return queryBuilder;
      },
      getOne: () => Promise.resolve(selectedToken ? this.shareLinks.get(selectedToken) ?? null : null)
    };

    return queryBuilder;
  }
}

describe("Files and share links (e2e)", () => {
  let app: INestApplication;
  let uploadRoot: string;
  let uploadDir: string;

  beforeEach(async () => {
    uploadRoot = join(process.cwd(), "test", ".tmp-e2e-uploads");
    uploadDir = join(uploadRoot, randomUUID());
    mkdirSync(uploadDir, { recursive: true });

    const moduleRef = await Test.createTestingModule({
      imports: [
        MulterModule.register({
          dest: uploadDir
        })
      ],
      controllers: [FilesController, ShareLinksController],
      providers: [
        FilesService,
        LocalFileStorageService,
        {
          provide: getRepositoryToken(FileRecord),
          useClass: InMemoryFilesRepository
        },
        {
          provide: getRepositoryToken(ShareLink),
          useClass: InMemoryShareLinksRepository
        },
        {
          provide: ConfigService,
          useValue: {
            get: (_key: string, defaultValue?: string) => defaultValue
          }
        }
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
      })
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    rmSync(uploadRoot, { recursive: true, force: true });
  });

  it("upload anonyme puis consultation et telechargement du lien public", async () => {
    const fileContent = "contenu e2e";
    const uploadResponse = await request(app.getHttpServer())
      .post("/files")
      .field("expirationDays", "3")
      .attach("file", Buffer.from(fileContent), {
        filename: "contrat.txt",
        contentType: "text/plain"
      })
      .expect(201);

    expect(uploadResponse.body).toMatchObject({
      file: {
        ownerId: null,
        originalName: "contrat.txt",
        size: Buffer.byteLength(fileContent),
        mimeType: "text/plain",
        tags: []
      },
      shareLink: {
        token: expect.any(String),
        url: expect.stringContaining("/download/"),
        passwordProtected: false
      }
    });

    const token = uploadResponse.body.shareLink.token as string;

    await request(app.getHttpServer())
      .get(`/share-links/${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          fileName: "contrat.txt",
          fileSize: Buffer.byteLength(fileContent),
          passwordRequired: false,
          status: "active"
        });
      });

    await request(app.getHttpServer())
      .post(`/share-links/${token}/download`)
      .send({})
      .expect(200)
      .expect("Content-Type", /text\/plain/)
      .expect("Content-Disposition", 'attachment; filename="contrat.txt"')
      .expect(({ text }) => {
        expect(text).toBe(fileContent);
      });
  });

  it("refuse puis autorise le telechargement d'un lien protege par mot de passe", async () => {
    const fileContent = "contenu protege";
    const uploadResponse = await request(app.getHttpServer())
      .post("/files")
      .field("sharePassword", "secret1")
      .attach("file", Buffer.from(fileContent), {
        filename: "secret.txt",
        contentType: "text/plain"
      })
      .expect(201);

    const token = uploadResponse.body.shareLink.token as string;
    expect(uploadResponse.body.shareLink.passwordProtected).toBe(true);

    await request(app.getHttpServer())
      .get(`/share-links/${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          fileName: "secret.txt",
          passwordRequired: true,
          status: "active"
        });
      });

    await request(app.getHttpServer())
      .post(`/share-links/${token}/download`)
      .send({
        password: "erreur"
      })
      .expect(401);

    await request(app.getHttpServer())
      .post(`/share-links/${token}/download`)
      .send({
        password: "secret1"
      })
      .expect(200)
      .expect("Content-Disposition", 'attachment; filename="secret.txt"')
      .expect(({ text }) => {
        expect(text).toBe(fileContent);
      });
  });
});
