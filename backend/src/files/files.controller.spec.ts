import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";

describe("FilesController", () => {
  let controller: FilesController;
  let filesService: jest.Mocked<Pick<FilesService, "deleteOwnFile" | "listOwnFiles" | "upload">>;

  const user = {
    id: "8f16a8a8-6046-43a2-85cc-dc639f6b7738",
    email: "claire.marie@datashare.fr"
  };

  const uploadedFile = {
    originalname: "contrat.pdf",
    filename: "storage-name.pdf",
    mimetype: "application/pdf",
    size: 120000,
    path: "uploads/storage-name.pdf"
  };

  beforeEach(() => {
    filesService = {
      deleteOwnFile: jest.fn(),
      listOwnFiles: jest.fn(),
      upload: jest.fn()
    };

    controller = new FilesController(filesService as unknown as FilesService);
  });

  it("delegue l'upload connecte au service avec l'id utilisateur", async () => {
    const uploadDto = {
      expirationDays: 3,
      sharePassword: "secret1",
      tags: ["projet"]
    };
    const response = {
      file: {
        id: "file-id",
        ownerId: user.id,
        originalName: "contrat.pdf",
        size: 120000,
        mimeType: "application/pdf",
        tags: ["projet"],
        createdAt: new Date("2026-01-01T10:00:00.000Z")
      },
      shareLink: {
        id: "share-link-id",
        token: "public-token",
        url: "http://localhost:5173/download/public-token",
        expiresAt: new Date("2026-01-04T10:00:00.000Z"),
        passwordProtected: true,
        createdAt: new Date("2026-01-01T10:00:00.000Z")
      }
    };
    filesService.upload.mockResolvedValue(response);

    await expect(controller.uploadFile(uploadedFile, uploadDto, { user })).resolves.toEqual(response);
    expect(filesService.upload).toHaveBeenCalledWith(uploadedFile, uploadDto, user.id);
  });

  it("delegue l'upload anonyme au service avec un proprietaire nul", async () => {
    const response = {
      file: {
        id: "file-id",
        ownerId: null,
        originalName: "contrat.pdf",
        size: 120000,
        mimeType: "application/pdf",
        tags: [],
        createdAt: new Date("2026-01-01T10:00:00.000Z")
      },
      shareLink: {
        id: "share-link-id",
        token: "public-token",
        url: "http://localhost:5173/download/public-token",
        expiresAt: null,
        passwordProtected: false,
        createdAt: new Date("2026-01-01T10:00:00.000Z")
      }
    };
    filesService.upload.mockResolvedValue(response);

    await expect(controller.uploadFile(uploadedFile, {}, {})).resolves.toEqual(response);
    expect(filesService.upload).toHaveBeenCalledWith(uploadedFile, {}, null);
  });

  it("retourne les fichiers de l'utilisateur courant", async () => {
    const items = [
      {
        id: "file-id",
        originalName: "contrat.pdf",
        size: 120000,
        mimeType: "application/pdf",
        tags: ["projet"],
        shareToken: "public-token",
        shareUrl: "http://localhost:5173/download/public-token",
        passwordProtected: true,
        expiresAt: null,
        status: "active" as const,
        createdAt: new Date("2026-01-01T10:00:00.000Z")
      }
    ];
    filesService.listOwnFiles.mockResolvedValue(items);

    await expect(controller.listOwnFiles({ status: "expired" }, { user })).resolves.toEqual({ items });
    expect(filesService.listOwnFiles).toHaveBeenCalledWith(user.id, "expired");
  });

  it("supprime uniquement un fichier appartenant a l'utilisateur courant", async () => {
    filesService.deleteOwnFile.mockResolvedValue(undefined);

    await expect(controller.deleteFile("file-id", { user })).resolves.toBeUndefined();
    expect(filesService.deleteOwnFile).toHaveBeenCalledWith("file-id", user.id);
  });
});
