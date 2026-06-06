import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FilesService } from "./files.service";

const DEFAULT_PURGE_INTERVAL_HOURS = 24;
const HOUR_IN_MS = 60 * 60 * 1000;
const MIN_PURGE_INTERVAL_MS = 1000;

@Injectable()
export class FilesExpirationScheduler implements OnModuleInit, OnModuleDestroy {
  private interval: NodeJS.Timeout | null = null;

  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService
  ) {}

  // Demarre la purge automatique quand le module NestJS est initialise.
  onModuleInit(): void {
    if (this.configService.get<string>("DISABLE_FILE_PURGE_INTERVAL", "false") === "true") {
      return;
    }

    const intervalMs = this.resolveIntervalMs();

    this.interval = setInterval(() => {
      void this.filesService.purgeExpiredFiles();
    }, intervalMs);
    this.interval.unref?.();
  }

  // Arrete proprement le timer de purge quand l'application s'eteint.
  onModuleDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  // Calcule l'intervalle de purge a partir des variables d'environnement.
  private resolveIntervalMs(): number {
    const configuredIntervalMs = this.parsePositiveNumber(
      this.configService.get<string>("FILE_PURGE_INTERVAL_MS")
    );

    if (configuredIntervalMs !== null) {
      return Math.max(Math.round(configuredIntervalMs), MIN_PURGE_INTERVAL_MS);
    }

    const configuredIntervalHours =
      this.parsePositiveNumber(
        this.configService.get<string>(
          "FILE_PURGE_INTERVAL_HOURS",
          String(DEFAULT_PURGE_INTERVAL_HOURS)
        )
      ) ?? DEFAULT_PURGE_INTERVAL_HOURS;

    return Math.max(configuredIntervalHours, 1) * HOUR_IN_MS;
  }

  // vérifie que la valeur dans .env est un nombre positif et retourne ce nombre
  // ou null si la valeur n'est pas valide
  private parsePositiveNumber(value: string | undefined): number | null {
    if (!value) {
      return null;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  }
}
