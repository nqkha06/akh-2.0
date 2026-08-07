import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { memoryStorage } from "multer";

import type { AuthenticatedUser } from "../auth/auth.types";
import { BusinessSettingsService } from "../business-settings/business-settings.service";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { BulkFilesDto } from "./dto/bulk-files.dto";
import { InitiateMultipartUploadDto } from "./dto/initiate-multipart-upload.dto";
import { ListFilesQueryDto } from "./dto/list-files-query.dto";
import { UpdateFileDto } from "./dto/update-file.dto";
import { FilesService } from "./files.service";
import {
  MULTIPART_PART_SIZE,
  MULTIPART_UPLOAD_STORAGE,
  type MultipartUploadStorage,
} from "./multipart-upload.storage";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("member/files")
@UseGuards(JwtAccessGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly businessSettings: BusinessSettingsService,
    @Inject(MULTIPART_UPLOAD_STORAGE)
    private readonly multipartUploadStorage: MultipartUploadStorage,
  ) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest, @Query() query: ListFilesQueryDto) {
    return this.filesService.findAll(request.user.id, query);
  }

  @Post("multipart")
  async initiateMultipartUpload(
    @Req() request: AuthenticatedRequest,
    @Body() body: InitiateMultipartUploadDto,
  ) {
    await this.validateUpload(body);
    return this.multipartUploadStorage.initiate(request.user.id, {
      fileName: body.fileName,
      mimeType: body.mimeType,
      size: body.size,
      purpose: body.purpose,
    });
  }

  @Post("multipart/:uploadId/parts/:partNumber")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["chunk"],
      properties: {
        chunk: {
          type: "string",
          format: "binary",
          description: "Một phần của file trong multipart upload.",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("chunk", {
    storage: memoryStorage(),
    limits: { fileSize: MULTIPART_PART_SIZE },
  }))
  uploadMultipartPart(
    @Req() request: AuthenticatedRequest,
    @Param("uploadId") uploadId: string,
    @Param("partNumber", ParseIntPipe) partNumber: number,
    @UploadedFile() chunk?: Express.Multer.File,
  ) {
    if (!chunk?.buffer) throw new BadRequestException("Part upload không hợp lệ.");
    return this.multipartUploadStorage.uploadPart(request.user.id, uploadId, partNumber, chunk.buffer);
  }

  @Post("multipart/:uploadId/complete")
  async completeMultipartUpload(
    @Req() request: AuthenticatedRequest,
    @Param("uploadId") uploadId: string,
  ) {
    const file = await this.multipartUploadStorage.complete(request.user.id, uploadId);
    try {
      return await this.filesService.create(request.user.id, file, file.purpose, uploadId);
    } catch (error) {
      await this.multipartUploadStorage.abort(request.user.id, uploadId).catch(() => undefined);
      throw error;
    }
  }

  @Delete("multipart/:uploadId")
  async abortMultipartUpload(
    @Req() request: AuthenticatedRequest,
    @Param("uploadId") uploadId: string,
  ) {
    await this.multipartUploadStorage.abort(request.user.id, uploadId);
    return { uploadId, aborted: true };
  }

  @Post("bulk-delete")
  removeMany(@Req() request: AuthenticatedRequest, @Body() dto: BulkFilesDto) {
    return this.filesService.removeMany(request.user.id, dto.ids);
  }

  @Patch(":id")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateFileDto,
  ) {
    return this.filesService.update(request.user.id, id, dto);
  }

  @Delete(":id")
  remove(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.filesService.remove(request.user.id, id);
  }

  @Get(":id/preview")
  @Header("Cache-Control", "private, max-age=0")
  async preview(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.filesService.previewOwned(request.user.id, id);
    response.set({
      "Content-Type": result.file.mimeType,
      "Content-Length": result.file.size.toString(),
      "Content-Disposition": `inline; filename="${encodeURIComponent(result.file.name)}"`,
    });
    return result.stream;
  }

  private async validateUpload(body: InitiateMultipartUploadDto) {
    const settings = await this.businessSettings.getRuntime();
    if (!settings.uploadAllowedMimeTypes.includes(body.mimeType.toLowerCase())) {
      throw new BadRequestException("Loại file này chưa được quản trị viên cho phép.");
    }
    const limit =
      body.purpose === "cover"
        ? settings.coverImageMaxBytes
        : settings.memberFileMaxBytes;
    if (body.size > limit) {
      throw new BadRequestException(
        `File vượt giới hạn ${Math.round(limit / 1024 / 1024)} MB.`,
      );
    }
    if (body.purpose !== "cover") return;
    if (!body.mimeType.toLowerCase().startsWith("image/")) {
      throw new BadRequestException("Cover image phải là file ảnh.");
    }
  }
}

@Controller("files")
export class PublicFilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get("link/:slug/download")
  @Header("Cache-Control", "private, max-age=0")
  async downloadLink(@Param("slug") slug: string, @Res({ passthrough: true }) response: Response) {
    const result = await this.filesService.downloadLinkDestination(slug);
    this.setHeaders(response, result.file);
    return result.stream;
  }

  private setHeaders(response: Response, file: { mimeType: string; size: number; name: string }) {
    response.set({
      "Content-Type": file.mimeType,
      "Content-Length": file.size.toString(),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
    });
  }
}
