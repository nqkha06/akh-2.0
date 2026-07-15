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
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { diskStorage, memoryStorage } from "multer";
import { mkdirSync } from "node:fs";

import { InitiateMultipartUploadDto } from "./dto/initiate-multipart-upload.dto";
import { UpdateFileDto } from "./dto/update-file.dto";
import {
  buildStoredFileName,
  FilesService,
  UploadedDiskFile,
} from "./files.service";
import {
  MULTIPART_PART_SIZE,
  MULTIPART_UPLOAD_STORAGE,
  type MultipartUploadStorage,
} from "./multipart-upload.storage";

@Controller("files")
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    @Inject(MULTIPART_UPLOAD_STORAGE)
    private readonly multipartUploadStorage: MultipartUploadStorage,
  ) {}

  @Get()
  findAll(
    @Query("q") q?: string,
    @Query("sort") sort?: "date" | "name" | "size" | "downloads",
    @Query("direction") direction?: "asc" | "desc",
    @Query("status") status?: "active" | "trash",
  ) {
    return this.filesService.findAll({ q, sort, direction, status });
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          const destination = process.env.UPLOAD_DIR || "uploads/files";
          mkdirSync(destination, { recursive: true });
          callback(null, destination);
        },
        filename: (_request, file, callback) => {
          callback(null, buildStoredFileName(file.originalname));
        },
      }),
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }),
  )
  async upload(
    @UploadedFile() file?: UploadedDiskFile,
    @Query("purpose") purpose?: "file" | "cover",
  ) {
    if (!file) {
      throw new BadRequestException("File không hợp lệ.");
    }

    if (purpose === "cover") {
      const mimeType = file.mimetype.toLowerCase();
      const maxCoverSize = 10 * 1024 * 1024;

      if (!mimeType.startsWith("image/")) {
        await this.filesService.forceRemoveLocalFile(file.path);
        throw new BadRequestException("Cover image phải là file ảnh.");
      }

      if (file.size > maxCoverSize) {
        await this.filesService.forceRemoveLocalFile(file.path);
        throw new BadRequestException("Cover image tối đa 10 MB.");
      }
    }

    return this.filesService.create(file);
  }

  @Post("multipart")
  async initiateMultipartUpload(@Body() body: InitiateMultipartUploadDto) {
    if (body.purpose === "cover") {
      if (!body.mimeType.toLowerCase().startsWith("image/")) {
        throw new BadRequestException("Cover image phải là file ảnh.");
      }

      if (body.size > 10 * 1024 * 1024) {
        throw new BadRequestException("Cover image tối đa 10 MB.");
      }
    }

    return this.multipartUploadStorage.initiate({
      fileName: body.fileName,
      mimeType: body.mimeType,
      size: body.size,
      purpose: body.purpose,
    });
  }

  @Post("multipart/:uploadId/parts/:partNumber")
  @UseInterceptors(
    FileInterceptor("chunk", {
      storage: memoryStorage(),
      limits: { fileSize: MULTIPART_PART_SIZE },
    }),
  )
  async uploadMultipartPart(
    @Param("uploadId") uploadId: string,
    @Param("partNumber", ParseIntPipe) partNumber: number,
    @UploadedFile() chunk?: Express.Multer.File,
  ) {
    if (!chunk?.buffer) {
      throw new BadRequestException("Part upload không hợp lệ.");
    }

    return this.multipartUploadStorage.uploadPart(uploadId, partNumber, chunk.buffer);
  }

  @Post("multipart/:uploadId/complete")
  async completeMultipartUpload(@Param("uploadId") uploadId: string) {
    const file = await this.multipartUploadStorage.complete(uploadId);

    try {
      return await this.filesService.create(file);
    } catch (error) {
      await this.filesService.forceRemoveLocalFile(file.path);
      throw error;
    }
  }

  @Delete("multipart/:uploadId")
  async abortMultipartUpload(@Param("uploadId") uploadId: string) {
    await this.multipartUploadStorage.abort(uploadId);
    return { uploadId, aborted: true };
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.filesService.update(id, updateFileDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.filesService.remove(id);
  }

  @Get(":id/download")
  @Header("Cache-Control", "private, max-age=0")
  async download(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response,
    @Query("disposition") disposition?: "attachment" | "inline",
  ) {
    const { file, stream } = await this.filesService.download(id);
    const isInlineImage =
      disposition === "inline" && file.mimeType.toLowerCase().startsWith("image/");

    res.set({
      "Content-Type": file.mimeType,
      "Content-Length": file.size.toString(),
      "Content-Disposition": `${isInlineImage ? "inline" : "attachment"}; filename="${encodeURIComponent(file.name)}"`,
    });

    return stream;
  }
}
