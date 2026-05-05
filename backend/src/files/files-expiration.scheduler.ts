import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FilesService } from "./files.service";

@Injectable()
export class FilesExpirationScheduler implements OnModuleInit, OnModuleDestroy {
  private interval: NodeJS.Timeout | null = null;

  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService
  ) {}

  onModuleInit(): void {
    if (this.configService.get<string>("DISABLE_FILE_PURGE_INTERVAL", "false") === "true") {
      return;
    }

    const intervalHours = Number.parseInt(
      this.configService.get<string>("FILE_PURGE_INTERVAL_HOURS", "24"),
      10
    );
    const intervalMs = Math.max(intervalHours, 1) * 60 * 60 * 1000;

    this.interval = setInterval(() => {
      void this.filesService.purgeExpiredFiles();
    }, intervalMs);
    this.interval.unref?.();
  }

  onModuleDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
