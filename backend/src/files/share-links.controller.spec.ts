import { ReadStream } from "node:fs";
import { Readable } from "node:stream";
import { StreamableFile } from "@nestjs/common";
import { Response } from "express";
import { FilesService } from "./files.service";
import { ShareLinksController } from "./share-links.controller";

describe("ShareLinksController", () => {
  let controller: ShareLinksController;
  let filesService: jest.Mocked<Pick<FilesService, "downloadSharedFile" | "getPublicShareLink">>;

  beforeEach(() => {
    filesService = {
      downloadSharedFile: jest.fn(),
      getPublicShareLink: jest.fn()
    };

    controller = new ShareLinksController(filesService as unknown as FilesService);
  });

  it("delegue la consultation d'un lien public au service", async () => {
    const response = {
      fileName: "contrat.pdf",
      fileSize: 120000,
      message: null,
      expiresAt: new Date("2026-01-04T10:00:00.000Z"),
      passwordRequired: true,
      status: "active" as const
    };
    filesService.getPublicShareLink.mockResolvedValue(response);

    await expect(controller.getShareLink("public-token")).resolves.toEqual(response);
    expect(filesService.getPublicShareLink).toHaveBeenCalledWith("public-token");
  });

  it("prepare les en-tetes du telechargement partage", async () => {
    const stream = Readable.from(["contenu"]) as unknown as ReadStream;
    filesService.downloadSharedFile.mockResolvedValue({
      stream,
      fileName: "contrat final.pdf",
      mimeType: "application/pdf",
      size: 120000
    });
    const response = {
      set: jest.fn()
    } as unknown as Response;

    const result = await controller.downloadSharedFile("public-token", { password: "secret1" }, response);

    expect(result).toBeInstanceOf(StreamableFile);
    expect(filesService.downloadSharedFile).toHaveBeenCalledWith("public-token", "secret1");
    expect(response.set).toHaveBeenCalledWith({
      "Content-Disposition": 'attachment; filename="contrat%20final.pdf"',
      "Content-Length": "120000",
      "Content-Type": "application/pdf"
    });
  });
});
