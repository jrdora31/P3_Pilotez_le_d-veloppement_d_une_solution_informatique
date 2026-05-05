import { Controller, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ExpirationPurgeResponse } from "./files-response.types";
import { FilesService } from "./files.service";

@Controller("maintenance")
export class MaintenanceController {
  constructor(private readonly filesService: FilesService) {}

  @Post("expired-files/purge")
  @UseGuards(AuthGuard("jwt"))
  purgeExpiredFiles(): Promise<ExpirationPurgeResponse> {
    return this.filesService.purgeExpiredFiles();
  }
}
