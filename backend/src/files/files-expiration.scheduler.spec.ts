import { ConfigService } from "@nestjs/config";
import { FilesExpirationScheduler } from "./files-expiration.scheduler";
import { FilesService } from "./files.service";

describe("FilesExpirationScheduler", () => {
  let filesService: { purgeExpiredFiles: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(() => {
    jest.useFakeTimers();
    filesService = {
      purgeExpiredFiles: jest.fn().mockResolvedValue({
        purgedFiles: 0,
        purgedShareLinks: 0,
        purgedBytes: 0,
        startedAt: new Date("2026-01-01T10:00:00.000Z"),
        finishedAt: new Date("2026-01-01T10:00:00.000Z")
      })
    };
    configService = {
      get: jest.fn((_key: string, defaultValue?: string) => defaultValue)
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("declenche la purge avec l'intervalle court configure", () => {
    configService.get.mockImplementation((key: string, defaultValue?: string) => {
      if (key === "FILE_PURGE_INTERVAL_MS") {
        return "5000";
      }

      return defaultValue;
    });
    const scheduler = new FilesExpirationScheduler(
      filesService as unknown as FilesService,
      configService as unknown as ConfigService
    );

    scheduler.onModuleInit();
    jest.advanceTimersByTime(4999);
    expect(filesService.purgeExpiredFiles).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(filesService.purgeExpiredFiles).toHaveBeenCalledTimes(1);

    scheduler.onModuleDestroy();
    jest.advanceTimersByTime(5000);
    expect(filesService.purgeExpiredFiles).toHaveBeenCalledTimes(1);
  });

  it("ne planifie pas la purge quand l'intervalle est desactive", () => {
    configService.get.mockImplementation((key: string, defaultValue?: string) => {
      if (key === "DISABLE_FILE_PURGE_INTERVAL") {
        return "true";
      }

      return defaultValue;
    });
    const scheduler = new FilesExpirationScheduler(
      filesService as unknown as FilesService,
      configService as unknown as ConfigService
    );

    scheduler.onModuleInit();
    jest.advanceTimersByTime(24 * 60 * 60 * 1000);

    expect(filesService.purgeExpiredFiles).not.toHaveBeenCalled();
  });
});
