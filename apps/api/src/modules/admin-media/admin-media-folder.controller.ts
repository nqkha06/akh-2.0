import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AdminMediaFolderService } from "./admin-media-folder.service";
import {
  CreateAdminMediaFolderDto,
  UpdateAdminMediaFolderDto,
} from "./dto/admin-media-folder.dto";

type AdminRequest = Request & { user: AuthenticatedUser };

@Controller("admin/media/folders")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminMediaFolderController {
  constructor(private readonly folders: AdminMediaFolderService) {}

  @Get()
  @Permissions("admin-media.read")
  findAll() {
    return this.folders.findAll();
  }

  @Post()
  @Permissions("admin-media.manage-folders")
  create(
    @Req() request: AdminRequest,
    @Body() dto: CreateAdminMediaFolderDto,
  ) {
    return this.folders.create(dto, request.user.id);
  }

  @Patch(":id")
  @Permissions("admin-media.manage-folders")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateAdminMediaFolderDto,
  ) {
    return this.folders.update(id, dto);
  }

  @Delete(":id")
  @Permissions("admin-media.manage-folders")
  remove(@Param("id") id: string) {
    return this.folders.remove(id);
  }
}
