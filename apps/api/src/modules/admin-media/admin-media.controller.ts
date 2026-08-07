import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { memoryStorage } from "multer";
import { ABSOLUTE_HTTP_UPLOAD_MAX_BYTES } from "@stu/contracts";

import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AdminMediaService } from "./admin-media.service";
import {
  BulkAdminMediaDto,
  BulkMoveAdminMediaDto,
  MoveAdminMediaDto,
  QueryAdminMediaDto,
  UpdateAdminMediaDto,
} from "./dto/admin-media.dto";

type AdminRequest = Request & { user: AuthenticatedUser };

@Controller("admin/media")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminMediaController {
  constructor(private readonly media: AdminMediaService) {}

  @Get()
  @Permissions("admin-media.read")
  findAll(@Query() query: QueryAdminMediaDto) {
    return this.media.findAll(query);
  }

  @Post("upload")
  @Permissions("admin-media.upload")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["files"],
      properties: {
        files: {
          type: "array",
          maxItems: 20,
          items: { type: "string", format: "binary" },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor("files", 20, {
      storage: memoryStorage(),
      limits: { fileSize: ABSOLUTE_HTTP_UPLOAD_MAX_BYTES, files: 20 },
    }),
  )
  upload(
    @Req() request: AdminRequest,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Query("folderId") folderId?: string,
  ) {
    return this.media.upload(
      files,
      !folderId || folderId === "root" ? null : folderId,
      request.user.id,
    );
  }

  @Post("bulk-delete")
  @Permissions("admin-media.delete")
  bulkDelete(@Body() dto: BulkAdminMediaDto) {
    return this.media.bulkRemove(dto.ids);
  }

  @Post("bulk-move")
  @Permissions("admin-media.update")
  bulkMove(@Body() dto: BulkMoveAdminMediaDto) {
    return this.media.bulkMove(dto);
  }

  @Get(":id")
  @Permissions("admin-media.read")
  findOne(@Param("id") id: string) {
    return this.media.findOne(id);
  }

  @Get(":id/content")
  @Permissions("admin-media.read")
  async content(
    @Param("id") id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { file, stream } = await this.media.download(id);
    response.set({
      "Content-Type": file.mimeType,
      "Content-Length": file.size.toString(),
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
    });
    return stream;
  }

  @Patch(":id")
  @Permissions("admin-media.update")
  update(@Param("id") id: string, @Body() dto: UpdateAdminMediaDto) {
    return this.media.update(id, dto);
  }

  @Patch(":id/move")
  @Permissions("admin-media.update")
  move(@Param("id") id: string, @Body() dto: MoveAdminMediaDto) {
    return this.media.move(id, dto.folderId ?? null);
  }

  @Delete(":id")
  @Permissions("admin-media.delete")
  remove(@Param("id") id: string) {
    return this.media.remove(id);
  }
}

@Controller("admin-media/public")
export class AdminMediaPublicController {
  constructor(private readonly media: AdminMediaService) {}

  @Get(":id/content")
  @Header("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
  async content(
    @Param("id") id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { file, stream } = await this.media.download(id);
    response.set({
      "Content-Type": file.mimeType,
      "Content-Length": file.size.toString(),
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
    });
    return stream;
  }
}
