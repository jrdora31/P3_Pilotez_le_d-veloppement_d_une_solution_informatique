import { FilesService } from "./files.service";
import { MaintenanceController } from "./maintenance.controller";

describe("MaintenanceController", () => {
  let controller: MaintenanceController;
  let filesService: jest.Mocked<Pick<FilesService, "purgeExpiredFiles">>;

  beforeEach(() => {
    filesService = {
      purgeExpiredFiles: jest.fn()
    };

    controller = new MaintenanceController(filesService as unknown as FilesService);
  });

  it("delegue la purge des fichiers expires au service", async () => {
    const response = {
      purgedFiles: 2,
      purgedShareLinks: 2,
      purgedBytes: 240000,
      startedAt: new Date("2026-01-01T10:00:00.000Z"),
      finishedAt: new Date("2026-01-01T10:00:01.000Z")
    };
    filesService.purgeExpiredFiles.mockResolvedValue(response);

    await expect(controller.purgeExpiredFiles()).resolves.toEqual(response);
    expect(filesService.purgeExpiredFiles).toHaveBeenCalledTimes(1);
  });
});
