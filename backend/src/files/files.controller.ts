import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthenticatedUser } from "../auth/authenticated-user.type";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { ListFilesQueryDto } from "./dto/list-files-query.dto";
import { UploadFileDto } from "./dto/upload-file.dto";
import { FilesService } from "./files.service";
import { FileListItem, UploadResponse } from "./files-response.types";
import { UploadedRequestFile } from "./uploaded-request-file.type";

interface OptionalAuthRequest {
  user?: AuthenticatedUser | null;
}

interface AuthRequest {
  user: AuthenticatedUser;
}

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(
    @UploadedFile() file: UploadedRequestFile | undefined,
    @Body() uploadDto: UploadFileDto,
    @Req() request: OptionalAuthRequest
  ): Promise<UploadResponse> {
    return this.filesService.upload(file, uploadDto, request.user?.id ?? null);
  }

  @Get()
  @UseGuards(AuthGuard("jwt"))
  async listOwnFiles(
    @Query() query: ListFilesQueryDto,
    @Req() request: AuthRequest
  ): Promise<{ items: FileListItem[] }> {
    return {
      items: await this.filesService.listOwnFiles(request.user.id, query.status)
    };
  }

  @Delete(":fileId")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(@Param("fileId") fileId: string, @Req() request: AuthRequest): Promise<void> {
    await this.filesService.deleteOwnFile(fileId, request.user.id);
  }
}
