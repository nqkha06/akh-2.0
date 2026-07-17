import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";

import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AdminLinksService } from "./admin-links.service";
import {
  BulkAdminLinksDto,
  BulkUpdateAdminLinksStatusDto,
} from "./dto/bulk-admin-links.dto";
import { ListAdminLinksQueryDto } from "./dto/list-admin-links-query.dto";
import { UpdateAdminLinkDto } from "./dto/update-admin-link.dto";

@Controller("admin/social-links")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminLinksController {
  constructor(private readonly adminLinksService: AdminLinksService) {}

  @Get()
  @Permissions("links.read")
  findAll(@Query() query: ListAdminLinksQueryDto) {
    return this.adminLinksService.findAll(query);
  }

  @Get(":id")
  @Permissions("links.read")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.adminLinksService.findOne(id);
  }

  @Patch("bulk/status")
  @Permissions("links.update")
  updateManyStatuses(@Body() dto: BulkUpdateAdminLinksStatusDto) {
    return this.adminLinksService.updateManyStatuses(dto);
  }

  @Patch("bulk/restore")
  @Permissions("links.update")
  restoreMany(@Body() dto: BulkAdminLinksDto) {
    return this.adminLinksService.restoreMany(dto.ids);
  }

  @Delete("bulk")
  @Permissions("links.delete")
  removeMany(@Body() dto: BulkAdminLinksDto) {
    return this.adminLinksService.removeMany(dto.ids);
  }

  @Patch(":id")
  @Permissions("links.update")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAdminLinkDto,
  ) {
    return this.adminLinksService.update(id, dto);
  }

  @Patch(":id/restore")
  @Permissions("links.update")
  restore(@Param("id", ParseIntPipe) id: number) {
    return this.adminLinksService.restore(id);
  }

  @Delete(":id")
  @Permissions("links.delete")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.adminLinksService.remove(id);
  }
}
