import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { diskStorage } from "multer";
import { mkdirSync } from "node:fs";

import { UpdateFileDto } from "./dto/update-file.dto";
import {
  buildStoredFileName,
  FilesService,
  UploadedDiskFile,
} from "./files.service";

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

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
