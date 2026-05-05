import { Body, Controller, Get, Header, Param, Post, Res, StreamableFile } from "@nestjs/common";
import { Response } from "express";
import { DownloadFileDto } from "./dto/download-file.dto";
import { ShareLinkPublic } from "./files-response.types";
import { FilesService } from "./files.service";

@Controller("share-links")
export class ShareLinksController {
  constructor(private readonly filesService: FilesService) {}

  @Get(":token")
  getShareLink(@Param("token") token: string): Promise<ShareLinkPublic> {
    return this.filesService.getPublicShareLink(token);
  }

  @Post(":token/download")
  @Header("Content-Type", "application/octet-stream")
  async downloadSharedFile(
    @Param("token") token: string,
    @Body() downloadDto: DownloadFileDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    const download = await this.filesService.downloadSharedFile(token, downloadDto.password);

    response.set({
      "Content-Disposition": `attachment; filename="${encodeURIComponent(download.fileName)}"`,
      "Content-Length": download.size.toString(),
      "Content-Type": download.mimeType
    });

    return new StreamableFile(download.stream);
  }
}
