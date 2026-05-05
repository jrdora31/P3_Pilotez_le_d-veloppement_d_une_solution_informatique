import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import { BadRequestException, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import { TypeOrmModule } from "@nestjs/typeorm";
import { diskStorage } from "multer";
import { AuthModule } from "../auth/auth.module";
import { FileRecord } from "./file-record.entity";
import { FilesController } from "./files.controller";
import { FilesExpirationScheduler } from "./files-expiration.scheduler";
import { FilesService } from "./files.service";
import { LocalFileStorageService } from "./local-file-storage.service";
import { MaintenanceController } from "./maintenance.controller";
import { ShareLink } from "./share-link.entity";
import { ShareLinksController } from "./share-links.controller";

const FORBIDDEN_EXTENSIONS = new Set([".bat", ".cmd", ".com", ".exe", ".msi", ".ps1", ".scr", ".sh"]);
const ONE_GIBIBYTE = 1024 * 1024 * 1024;

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([FileRecord, ShareLink]),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uploadDir = configService.get<string>("UPLOAD_DIR", join(process.cwd(), "uploads"));
        mkdirSync(uploadDir, { recursive: true });

        return {
          storage: diskStorage({
            destination: uploadDir,
            filename: (_request, file, callback) => {
              const extension = extname(file.originalname).toLowerCase();
              callback(null, `${randomUUID()}${extension}`);
            }
          }),
          limits: {
            fileSize: ONE_GIBIBYTE
          },
          fileFilter: (_request, file, callback) => {
            const extension = extname(file.originalname).toLowerCase();

            if (FORBIDDEN_EXTENSIONS.has(extension)) {
              callback(new BadRequestException("Ce type de fichier n'est pas autorise."), false);
              return;
            }

            callback(null, true);
          }
        };
      }
    })
  ],
  controllers: [FilesController, ShareLinksController, MaintenanceController],
  providers: [FilesService, LocalFileStorageService, FilesExpirationScheduler],
  exports: [FilesService]
})
export class FilesModule {}
