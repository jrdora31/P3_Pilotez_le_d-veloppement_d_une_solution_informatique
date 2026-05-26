import { promises as fs } from "node:fs";
import { LocalFileStorageService } from "./local-file-storage.service";

jest.mock("node:fs", () => ({
  promises: {
    unlink: jest.fn()
  }
}));

describe("LocalFileStorageService", () => {
  let service: LocalFileStorageService;
  const unlink = fs.unlink as jest.MockedFunction<typeof fs.unlink>;

  beforeEach(() => {
    service = new LocalFileStorageService();
    unlink.mockReset();
  });

  it("supprime le fichier physique", async () => {
    unlink.mockResolvedValue(undefined);

    await expect(service.deleteFile("uploads/storage-name.pdf")).resolves.toBeUndefined();
    expect(unlink).toHaveBeenCalledWith("uploads/storage-name.pdf");
  });

  it("ignore les fichiers deja absents", async () => {
    const error = Object.assign(new Error("missing file"), { code: "ENOENT" });
    unlink.mockRejectedValue(error);

    await expect(service.deleteFile("uploads/missing.pdf")).resolves.toBeUndefined();
  });

  it("propage les erreurs de suppression inattendues", async () => {
    const error = Object.assign(new Error("permission denied"), { code: "EACCES" });
    unlink.mockRejectedValue(error);

    await expect(service.deleteFile("uploads/protected.pdf")).rejects.toThrow(error);
  });
});
